package com.qlskdd.controller;

import com.qlskdd.mapper.response.BaseRes;
import com.qlskdd.mapper.response.EventRes;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<BaseRes<Void>> createEvent() {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseRes.success("Tạo sự kiện thành công", null));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('ORGANIZER') and @eventSecurityService.canManageEvent(authentication.name, #id))")
    public ResponseEntity<BaseRes<Void>> updateEvent(@PathVariable Long id) {
        return ResponseEntity.ok(BaseRes.success("Cập nhật sự kiện thành công", null));
    }
}