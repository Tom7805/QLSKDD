package com.qlskdd.mapper.response;

import lombok.Builder;
import lombok.Data;

// B5.4-T2: response của GET /api/v1/dashboard/summary — 4 thẻ số liệu + tỷ lệ điểm danh.
// attendanceRate = totalCheckIns / totalRegistrations * 100 (AttendanceRateUtil),
// làm tròn 1 chữ số thập phân, 0.0 khi chưa có ai đăng ký (không lỗi chia 0).
@Data
@Builder
public class DashboardStatRes {
    private long totalEvents;
    private long upcomingEvents;
    private long totalRegistrations;
    private long totalCheckIns;
    private double attendanceRate;
}
