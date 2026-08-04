package com.qlskdd.repository;

import com.qlskdd.entity.Registration;
import com.qlskdd.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    // B2.3-T1: đếm số lượt đăng ký ACTIVE của 1 sự kiện — dùng để chặn giảm capacity
    long countByEventIdAndStatus(Long eventId, RegistrationStatus status);

    // B2.5-T1: đếm số đăng ký theo trạng thái cho CẢ MỘT TRANG sự kiện bằng đúng 1 truy
    // vấn group by (tránh N+1 nếu gọi countByEventIdAndStatus lặp lại cho từng sự kiện)
    @Query("SELECT r.event.id, COUNT(r) FROM Registration r "
            + "WHERE r.status = :status AND r.event.id IN :eventIds GROUP BY r.event.id")
    List<Object[]> countGroupedByEventIdsAndStatus(@Param("eventIds") List<Long> eventIds,
                                                     @Param("status") RegistrationStatus status);
}
