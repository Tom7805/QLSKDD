package com.qlskdd.mapper.response;

// B4.2-T2: 3 số liệu tổng đăng ký / có mặt / vắng, tính đúng 1 lần ở tầng service.
public record AttendanceSummary(long totalRegistered, long present, long absent, double attendanceRate) {
}
