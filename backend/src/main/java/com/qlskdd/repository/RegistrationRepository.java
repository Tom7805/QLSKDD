package com.qlskdd.repository;

import com.qlskdd.entity.Registration;
import com.qlskdd.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    // B2.3-T1: đếm số lượt đăng ký ACTIVE của 1 sự kiện — dùng để chặn giảm capacity
    long countByEventIdAndStatus(Long eventId, RegistrationStatus status);

    // B3.1-T2: kiểm tra đăng ký trùng
    boolean existsByEventIdAndUserIdAndStatus(Long eventId, Long userId, RegistrationStatus status);

    // B3.1-T2: tìm theo mã vé
    Optional<Registration> findByCode(String code);

    // B3.1-T2: truy vấn danh sách đăng ký của sự kiện kèm thông tin user (chống N+1)
    @EntityGraph(attributePaths = {"user"})
    Page<Registration> findByEventId(Long eventId, Pageable pageable);

    // B4.2-T1: toàn bộ lượt đăng ký ACTIVE của 1 sự kiện, kèm sẵn user (chống N+1) —
    // dùng làm nguồn "tổng đăng ký", sau đó tách nhóm có mặt/vắng ở service bằng cách
    // đối chiếu với danh sách registrationId đã điểm danh (1 truy vấn khác), thay vì
    // chạy 2 truy vấn EXISTS/NOT EXISTS riêng cho từng nhóm.
    @EntityGraph(attributePaths = {"user"})
    List<Registration> findByEventIdAndStatus(Long eventId, RegistrationStatus status);

    // B2.5-T1: đếm số đăng ký theo trạng thái cho CẢ MỘT TRANG sự kiện bằng đúng 1 truy
    // vấn group by (tránh N+1 nếu gọi countByEventIdAndStatus lặp lại cho từng sự kiện)
    @Query("SELECT r.event.id, COUNT(r) FROM Registration r "
            + "WHERE r.status = :status AND r.event.id IN :eventIds GROUP BY r.event.id")
    List<Object[]> countGroupedByEventIdsAndStatus(@Param("eventIds") List<Long> eventIds,
                                                     @Param("status") RegistrationStatus status);

    // B3.4-T1: đếm số lượt đăng ký ACTIVE của 1 người tham gia — dùng để chặn xoá
    long countByUserIdAndStatus(Long userId, RegistrationStatus status);

    // B3.4-T1: đếm số lượt đăng ký ACTIVE cho CẢ MỘT TRANG người tham gia bằng đúng 1
    // truy vấn group by (tránh N+1), dùng cho cột "số sự kiện đã đăng ký"
    @Query("SELECT r.user.id, COUNT(r) FROM Registration r "
            + "WHERE r.status = :status AND r.user.id IN :userIds GROUP BY r.user.id")
    List<Object[]> countGroupedByUserIdsAndStatus(@Param("userIds") List<Long> userIds,
                                                    @Param("status") RegistrationStatus status);

    // B3.2-T5 (FE "Sự kiện của tôi"): danh sách lượt đăng ký của chính người đang đăng
    // nhập, kèm sự kiện (chống N+1) — mới nhất lên trước
    @EntityGraph(attributePaths = {"event"})
    Page<Registration> findByUserUsernameOrderByRegisteredAtDesc(String username, Pageable pageable);
}
