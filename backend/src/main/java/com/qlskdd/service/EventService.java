package com.qlskdd.service;

import org.springframework.data.domain.Pageable;

import com.qlskdd.dto.request.EventReq;
import com.qlskdd.dto.request.EventStatusReq;
import com.qlskdd.mapper.response.EventDetailRes;
import com.qlskdd.mapper.response.EventRes;
import com.qlskdd.mapper.response.PageRes;

public interface EventService {
    // B2.5-T1/T2 + B5.1 + B5.2-T1/T2: điểm vào duy nhất của GET /events. keyword rỗng/null,
    // categoryId null, status rỗng/null, from/to rỗng/null -> bỏ qua điều kiện tương ứng
    // (không lỗi). from/to nhận dạng thô yyyy-MM-dd, service tự parse + validate (from > to,
    // định dạng sai, status không hợp lệ -> 400) — controller không nhảy tầng validate.
    PageRes<EventRes> searchEvents(String keyword, Long categoryId, String status, String from, String to, Pageable pageable);

    // B2.5-T2: chi tiết 1 sự kiện, gồm loại, người tạo, tổng đăng ký, số chỗ còn lại
    EventDetailRes getById(Long id);

    // B2.2-T4: tạo sự kiện mới, gán createdBy = người đang đăng nhập, status = OPEN
    EventDetailRes create(EventReq req);

    // B2.3-T1: sửa sự kiện — dùng lại đúng validate của EventReq (@ValidEventTime),
    // chặn giảm capacity xuống dưới số đăng ký ACTIVE hiện có. Quyền sở hữu (ORGANIZER
    // chỉ sửa được sự kiện của mình) đã chặn ở @PreAuthorize của controller.
    EventDetailRes update(Long id, EventReq req);

    // B2.4-T1: đóng/huỷ/mở lại sự kiện. Chỉ cho phép OPEN→CLOSED, OPEN→CANCELLED,
    // CLOSED→OPEN; chuyển khác các cặp này → 400.
    EventDetailRes changeStatus(Long id, EventStatusReq req);
}
