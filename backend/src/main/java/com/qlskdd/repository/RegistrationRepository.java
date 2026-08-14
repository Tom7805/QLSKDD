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

    // B3.1/B3.2: bảng registrations có unique constraint (event_id, user_id) bất kể status
    // (huỷ đăng ký chỉ đổi status, không xoá bản ghi — giữ lịch sử). Vì vậy 1 user chỉ có
    // ĐÚNG 1 bản ghi cho 1 sự kiện; đăng ký lại sau khi huỷ phải tái sử dụng bản ghi cũ này
    // (đổi status + mã vé mới) thay vì insert bản ghi mới, nếu không sẽ vi phạm unique
    // constraint ở DB -> lỗi 500 (xem RegistrationServiceImpl.register()).
    Optional<Registration> findByEventIdAndUserId(Long eventId, Long userId);

    // B3.1-T2: tìm theo mã vé
    Optional<Registration> findByCode(String code);

    // B4.5-T1: kiểm tra trùng mã trước khi lưu — sinh trùng thì thử lại (xem
    // RegistrationServiceImpl.generateUniqueCode)
    boolean existsByCode(String code);

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

    // B4.4-T1: status=all — toàn bộ ĐK ACTIVE của sự kiện, phân trang + sắp xếp theo họ
    // tên (Sort truyền qua Pageable ở controller), kèm sẵn user (chống N+1)
    @EntityGraph(attributePaths = {"user"})
    Page<Registration> findByEventIdAndStatus(Long eventId, RegistrationStatus status, Pageable pageable);

    // B4.4-T1: status=present — chỉ ĐK ACTIVE đã có bản ghi điểm danh
    @EntityGraph(attributePaths = {"user"})
    @Query(value = "SELECT r FROM Registration r WHERE r.event.id = :eventId "
            + "AND r.status = com.qlskdd.enums.RegistrationStatus.ACTIVE "
            + "AND EXISTS (SELECT c FROM CheckInHistory c WHERE c.registration = r)",
            countQuery = "SELECT COUNT(r) FROM Registration r WHERE r.event.id = :eventId "
            + "AND r.status = com.qlskdd.enums.RegistrationStatus.ACTIVE "
            + "AND EXISTS (SELECT c FROM CheckInHistory c WHERE c.registration = r)")
    Page<Registration> findPresentByEventId(@Param("eventId") Long eventId, Pageable pageable);

    // B4.4-T1: status=absent — chỉ ĐK ACTIVE chưa có bản ghi điểm danh
    @EntityGraph(attributePaths = {"user"})
    @Query(value = "SELECT r FROM Registration r WHERE r.event.id = :eventId "
            + "AND r.status = com.qlskdd.enums.RegistrationStatus.ACTIVE "
            + "AND NOT EXISTS (SELECT c FROM CheckInHistory c WHERE c.registration = r)",
            countQuery = "SELECT COUNT(r) FROM Registration r WHERE r.event.id = :eventId "
            + "AND r.status = com.qlskdd.enums.RegistrationStatus.ACTIVE "
            + "AND NOT EXISTS (SELECT c FROM CheckInHistory c WHERE c.registration = r)")
    Page<Registration> findAbsentByEventId(@Param("eventId") Long eventId, Pageable pageable);

    // B5.4-T1: tổng lượt đăng ký hợp lệ (status = ACTIVE) trên TOÀN hệ thống — chỉ số
    // "tổng lượt đăng ký" của GET /api/v1/dashboard/summary. Lượt đã huỷ (CANCELLED) không tính.
    long countByStatus(RegistrationStatus status);

    // B5.4-T1: Top N sự kiện có nhiều lượt đăng ký ACTIVE nhất — group by + order by desc,
    // giới hạn bằng pageable (List + Pageable chỉ áp dụng LIMIT, không chạy count query).
    // Trả về cột: { eventId, eventName, capacity, COUNT(registration) }. capacity null khi sự
    // kiện seed từ B0.4 chưa set — service tính fillRate dựa trên khả năng capacity null.
    @Query("SELECT r.event.id, r.event.name, r.event.capacity, COUNT(r) FROM Registration r "
            + "WHERE r.status = :status "
            + "GROUP BY r.event.id, r.event.name, r.event.capacity "
            + "ORDER BY COUNT(r) DESC")
    List<Object[]> findTopEventsGroupedByStatus(@Param("status") RegistrationStatus status, Pageable pageable);
}
