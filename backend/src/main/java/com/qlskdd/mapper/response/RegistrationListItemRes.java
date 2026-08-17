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

    // B4.1: tính từ CheckInHistoryRepository.findCheckedInRegistrationIds (1 truy vấn
    // cho cả trang, không N+1) — xem RegistrationServiceImpl.getRegistrationsByEvent.
    private boolean checkedIn;
}
