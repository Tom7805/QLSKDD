package com.qlskdd.service;

import com.qlskdd.dto.response.EventRes;
import com.qlskdd.dto.response.PageRes;
import org.springframework.data.domain.Pageable;

public interface EventService {
    PageRes<EventRes> getAllEvents(Pageable pageable);
}