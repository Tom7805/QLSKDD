package com.qlskdd.mapper.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

// B4.2-T2/B4.4-T2: 1 dòng trong danh sách "có mặt"/"vắng" (B4.2, tách theo 2 mảng riêng)
// hoặc trong danh sách điểm danh có lọc (B4.4, gộp chung 1 danh sách phân trang) —
// checkedInAt luôn null khi checkedIn = false.
@Data
@Builder
public class AttendanceItemRes {
    private Long registrationId;
    private String fullName;
    private String email;
    private String phone;
    private LocalDateTime registeredAt;
    private boolean checkedIn;
    private LocalDateTime checkedInAt;
}
