package com.qlskdd.mapper.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

// B4.2-T2: 1 dòng trong danh sách "có mặt" hoặc "vắng" — checkedInAt luôn null ở nhóm vắng.
@Data
@Builder
public class AttendanceItemRes {
    private Long registrationId;
    private String fullName;
    private String email;
    private String phone;
    private LocalDateTime registeredAt;
    private LocalDateTime checkedInAt;
}
