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
}
