package com.qlskdd.service.impl;

import com.qlskdd.dto.response.EventRes;
import com.qlskdd.dto.response.PageRes;
import com.qlskdd.entity.Event;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {
    
    private final EventRepository eventRepository;

    @Override
    public PageRes<EventRes> getAllEvents(Pageable pageable) {
        // Lấy Page<Event> từ DB
        Page<Event> eventPage = eventRepository.findAll(pageable);
        
        // Map từ Entity sang DTO
        Page<EventRes> dtoPage = eventPage.map(event -> {
            EventRes res = new EventRes();
            res.setId(event.getId());
            res.setName(event.getName());
            res.setLocation(event.getLocation());
            res.setStartAt(event.getStartAt());
            res.setEndAt(event.getEndAt());
            res.setStatus(event.getStatus());
            return res;
        });
        
        // Bọc vào PageRes chuẩn hóa
        return PageRes.of(dtoPage);
    }
}