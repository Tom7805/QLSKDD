package com.qlskdd.mapper.response;

import com.qlskdd.enums.EventStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EventRes {
    private Long id;
    private String name;
    private String location;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private EventStatus status;

    // B2.5-T1: null nếu sự kiện chưa có capacity (dữ liệu mẫu cũ từ B0.4)
    private Integer capacity;
    private Integer availableSeats;

    // B4.3-T4: tỷ lệ tham dự hiển thị ngay ở danh sách sự kiện — cùng công thức và
    // cùng nguồn tính (AttendanceRateUtil) với chi tiết sự kiện và attendance-summary.
    private Double attendanceRate;
}