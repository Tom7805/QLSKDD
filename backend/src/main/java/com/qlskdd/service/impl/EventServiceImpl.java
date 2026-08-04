package com.qlskdd.service.impl;

import com.qlskdd.dto.request.EventReq;
import com.qlskdd.entity.Event;
import com.qlskdd.entity.EventCategory;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.mapper.EventMapper;
import com.qlskdd.mapper.response.EventDetailRes;
import com.qlskdd.mapper.response.EventRes;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.repository.CategoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final EventMapper eventMapper;

    @Override
    public EventDetailRes create(EventReq req) {
        EventCategory category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Loại sự kiện", "id", req.getCategoryId()));

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        Event event = new Event();
        event.setName(req.getName());
        event.setDescription(req.getDescription());
        event.setLocation(req.getLocation());
        event.setCapacity(req.getCapacity());
        event.setCategory(category);
        event.setStartAt(req.getStartAt());
        event.setEndAt(req.getEndAt());
        event.setStatus(EventStatus.OPEN);
        event.setCreatedBy(currentUsername);
        event.setCreatedAt(LocalDateTime.now());

        return eventMapper.toDetailRes(eventRepository.save(event));
    }

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