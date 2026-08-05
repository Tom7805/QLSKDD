package com.qlskdd.mapper.response;

import com.qlskdd.enums.RegistrationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

// B3.3-T2: 1 dòng trong danh sách người đăng ký của 1 sự kiện.
@Data
@Builder
public class RegistrationListItemRes {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private LocalDateTime registeredAt;
    private RegistrationStatus status;

    // TODO(B4.1): tính từ CheckInHistoryRepository.existsByRegistrationId khi tính
    // năng điểm danh được triển khai — hiện luôn trả về false.
    private boolean checkedIn;
}
