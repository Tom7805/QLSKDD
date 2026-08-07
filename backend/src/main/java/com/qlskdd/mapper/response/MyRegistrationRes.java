package com.qlskdd.mapper.response;

import com.qlskdd.enums.EventStatus;
import com.qlskdd.enums.RegistrationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

// B3.2-T5: 1 dòng trong trang "Sự kiện của tôi" — đủ dữ liệu để FE hiển thị danh sách
// và quyết định hiện/ẩn nút Huỷ mà không phải tự lặp lại luật nghiệp vụ.
@Data
@Builder
public class MyRegistrationRes {
    private Long registrationId;
    private String code;
    private RegistrationStatus registrationStatus;
    private LocalDateTime registeredAt;

    private Long eventId;
    private String eventName;
    private String location;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private EventStatus eventStatus;

    // Đúng luật đang áp dụng trong RegistrationServiceImpl.cancel(): còn ACTIVE và
    // sự kiện chưa bắt đầu. CHƯA tính điều kiện "đã điểm danh" vì B4.1 (CheckInHistory)
    // chưa được triển khai trong code — khi B4.1 xong cần cập nhật lại cờ này ở
    // RegistrationServiceImpl.toMyRegistrationRes().
    private boolean canCancel;
}
