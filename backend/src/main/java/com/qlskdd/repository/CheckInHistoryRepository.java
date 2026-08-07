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
}
