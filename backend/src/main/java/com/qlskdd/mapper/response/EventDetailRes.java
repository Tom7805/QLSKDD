package com.qlskdd.mapper.response;

import com.qlskdd.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDetailRes {
    private Long id;
    private String name;
    private String description;
    private String location;
    private Integer capacity;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private EventStatus status;
    private Long categoryId;
    private String categoryName;
    private String createdBy;
    private LocalDateTime createdAt;

    // B2.5-T2: tổng đăng ký ACTIVE + số chỗ còn lại (null nếu event chưa có capacity)
    private Long totalRegistered;
    private Integer availableSeats;

    // B4.3-T2: tỷ lệ tham dự = present / totalRegistered * 100, làm tròn 1 chữ số thập
    // phân — công thức dùng chung ở AttendanceRateUtil, xem thêm mục 16 attendance-summary
    private Double attendanceRate;
}
