package com.qlskdd.service;

import org.springframework.data.domain.Pageable;

import com.qlskdd.mapper.response.EventRes;
import com.qlskdd.mapper.response.PageRes;

public interface EventService {
    PageRes<EventRes> getAllEvents(Pageable pageable);
}