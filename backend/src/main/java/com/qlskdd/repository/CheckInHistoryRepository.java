package com.qlskdd.repository;

import com.qlskdd.entity.CheckInHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CheckInHistoryRepository extends JpaRepository<CheckInHistory, Long> {

    // B4.1-T2: chặn điểm danh trùng — kiểm tra trước khi tạo bản ghi mới
    boolean existsByRegistrationId(Long registrationId);

    Optional<CheckInHistory> findByRegistrationId(Long registrationId);

    // B4.1-T2: đếm số người đã có mặt (đã điểm danh) của 1 sự kiện
    long countByRegistration_EventId(Long eventId);

    // B3.3-T2: xác định các registrationId nào (trong 1 trang) đã điểm danh, dùng 1 truy
    // vấn group cho cả trang thay vì existsByRegistrationId lặp lại từng dòng (tránh N+1)
    @Query("SELECT c.registration.id FROM CheckInHistory c WHERE c.registration.id IN :registrationIds")
    List<Long> findCheckedInRegistrationIds(@Param("registrationIds") List<Long> registrationIds);

    // B4.2-T1: registrationId + thời điểm điểm danh cho CẢ NHÓM registrationId truyền vào,
    // bằng đúng 1 truy vấn (thay vì findByRegistrationId lặp lại từng dòng) — dùng để tách
    // nhóm có mặt/vắng và hiển thị checkedInAt cho nhóm có mặt ở B4.2-T2.
    @Query("SELECT c.registration.id, c.checkedInAt FROM CheckInHistory c WHERE c.registration.id IN :registrationIds")
    List<Object[]> findCheckedInAtByRegistrationIds(@Param("registrationIds") List<Long> registrationIds);

    // B4.3-T4: đếm số đã điểm danh (present) cho CẢ MỘT TRANG sự kiện bằng đúng 1 truy
    // vấn group by (tránh N+1) — dùng để tính attendanceRate ở danh sách sự kiện.
    @Query("SELECT c.registration.event.id, COUNT(c) FROM CheckInHistory c "
            + "WHERE c.registration.event.id IN :eventIds GROUP BY c.registration.event.id")
    List<Object[]> countGroupedByEventIds(@Param("eventIds") List<Long> eventIds);

    // B5.4-T1: "tổng lượt điểm danh" của GET /api/v1/dashboard/summary dùng thẳng count()
    // có sẵn của JpaRepository (1 truy vấn COUNT toàn bộ bảng check_in_histories).
}
