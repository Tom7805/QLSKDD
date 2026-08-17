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

    // Loại sự kiện đã có sẵn ở EventDetailRes; bổ sung vào danh sách để lịch tuần tô màu
    // được từng sự kiện theo loại mà không phải gọi thêm API chi tiết cho mỗi sự kiện.
    // Null với các sự kiện mẫu cũ (B0.4) chưa gán loại.
    private Long categoryId;
    private String categoryName;

    // B4.3-T4: tỷ lệ tham dự hiển thị ngay ở danh sách sự kiện — cùng công thức và
    // cùng nguồn tính (AttendanceRateUtil) với chi tiết sự kiện và attendance-summary.
    private Double attendanceRate;
}