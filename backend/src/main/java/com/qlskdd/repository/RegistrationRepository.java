package com.qlskdd.repository;

import com.qlskdd.entity.Registration;
import com.qlskdd.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    // B2.3-T1: đếm số lượt đăng ký ACTIVE của 1 sự kiện — dùng để chặn giảm capacity
    long countByEventIdAndStatus(Long eventId, RegistrationStatus status);
}
