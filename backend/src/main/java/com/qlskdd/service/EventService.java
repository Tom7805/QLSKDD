package com.qlskdd.service;

import org.springframework.data.domain.Pageable;

import com.qlskdd.dto.request.EventReq;
import com.qlskdd.mapper.response.EventDetailRes;
import com.qlskdd.mapper.response.EventRes;
import com.qlskdd.mapper.response.PageRes;

public interface EventService {
    PageRes<EventRes> getAllEvents(Pageable pageable);

    // B2.2-T4: tạo sự kiện mới, gán createdBy = người đang đăng nhập, status = OPEN
    EventDetailRes create(EventReq req);

    // B2.3-T1: sửa sự kiện — dùng lại đúng validate của EventReq (@ValidEventTime),
    // chặn giảm capacity xuống dưới số đăng ký ACTIVE hiện có. Quyền sở hữu (ORGANIZER
    // chỉ sửa được sự kiện của mình) đã chặn ở @PreAuthorize của controller.
    EventDetailRes update(Long id, EventReq req);
}
