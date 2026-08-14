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

    // B3.1: người dùng hiện tại đã có lượt đăng ký ACTIVE cho sự kiện này chưa — để FE
    // hiện đúng "Đã đăng ký" ngay khi tải trang, không đợi bấm nút mới biết trùng đăng ký.
    // Đặt tên KHÔNG có tiền tố "is": nếu field tên isRegistered, Lombok sinh getter
    // isRegistered() và Jackson sẽ bỏ tiền tố "is" khi serialize -> JSON field thành ra
    // "registered" chứ không phải "isRegistered", dễ gây lệch tên ngầm với FE.
    private boolean registered;
}
