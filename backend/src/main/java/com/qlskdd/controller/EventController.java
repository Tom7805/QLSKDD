package com.qlskdd.controller;

import com.qlskdd.dto.response.BaseRes;
import com.qlskdd.dto.response.EventRes;
import com.qlskdd.dto.response.PageRes;
import com.qlskdd.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<BaseRes<PageRes<EventRes>>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        PageRes<EventRes> result = eventService.getAllEvents(pageable);
        
        return ResponseEntity.ok(BaseRes.success("Lấy danh sách sự kiện thành công", result));
    }
}