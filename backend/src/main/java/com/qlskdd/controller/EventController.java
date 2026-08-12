package com.qlskdd.controller;

import com.qlskdd.dto.request.EventReq;
import com.qlskdd.dto.request.EventStatusReq;
import com.qlskdd.mapper.response.AttendanceItemRes;
import com.qlskdd.mapper.response.AttendanceSummaryRes;
import com.qlskdd.mapper.response.BaseRes;
import com.qlskdd.mapper.response.EventDetailRes;
import com.qlskdd.mapper.response.EventRegistrationsRes;
import com.qlskdd.mapper.response.EventRes;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.service.EventService;
import com.qlskdd.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final RegistrationService registrationService;

    @GetMapping
    public ResponseEntity<BaseRes<PageRes<EventRes>>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // B2.5-T2: mặc định sort theo startAt tăng dần (sự kiện sắp diễn ra lên trước)
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "startAt"));
        PageRes<EventRes> result = eventService.getAllEvents(pageable);

        return ResponseEntity.ok(BaseRes.success("Lấy danh sách sự kiện thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseRes<EventDetailRes>> getEventById(@PathVariable Long id) {
        EventDetailRes result = eventService.getById(id);
        return ResponseEntity.ok(BaseRes.success("Lấy chi tiết sự kiện thành công", result));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<BaseRes<EventDetailRes>> createEvent(@Valid @RequestBody EventReq req) {
        EventDetailRes created = eventService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseRes.of(HttpStatus.CREATED.value(), "Tạo sự kiện thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<BaseRes<EventDetailRes>> updateEvent(@PathVariable Long id, @Valid @RequestBody EventReq req) {
        EventDetailRes updated = eventService.update(id, req);
        return ResponseEntity.ok(BaseRes.success("Cập nhật sự kiện thành công", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<BaseRes<EventDetailRes>> changeStatus(@PathVariable Long id,
                                                                  @Valid @RequestBody EventStatusReq req) {
        EventDetailRes updated = eventService.changeStatus(id, req);
        return ResponseEntity.ok(BaseRes.success("Cập nhật trạng thái sự kiện thành công", updated));
    }

    // B3.3-T2: chỉ ADMIN/ORGANIZER xem được danh sách người đăng ký — người khác 403
    @GetMapping("/{id}/registrations")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<BaseRes<EventRegistrationsRes>> getEventRegistrations(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // B3.3-T1: mặc định sắp xếp theo registeredAt giảm dần (đăng ký gần nhất lên đầu)
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "registeredAt"));
        EventRegistrationsRes result = registrationService.getRegistrationsByEvent(id, pageable);

        return ResponseEntity.ok(BaseRes.success("Lấy danh sách người đăng ký thành công", result));
    }

    // B4.2-T3: chỉ ADMIN/ORGANIZER xem được tổng hợp điểm danh — người khác 403
    @GetMapping("/{id}/attendance-summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<BaseRes<AttendanceSummaryRes>> getAttendanceSummary(@PathVariable Long id) {
        AttendanceSummaryRes result = registrationService.getAttendanceSummary(id);
        return ResponseEntity.ok(BaseRes.success("Lấy tổng hợp điểm danh thành công", result));
    }

    // B4.4-T2: danh sách điểm danh có lọc theo trạng thái — status=all|present|absent
    // (mặc định all); status không hợp lệ -> 400 (xem AttendanceFilter). Chỉ ADMIN/ORGANIZER.
    @GetMapping("/{id}/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    public ResponseEntity<BaseRes<PageRes<AttendanceItemRes>>> getAttendanceList(
            @PathVariable Long id,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // B4.4-T1: sắp xếp mặc định theo họ tên
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "user.fullName"));
        PageRes<AttendanceItemRes> result = registrationService.getAttendanceList(id, status, pageable);

        return ResponseEntity.ok(BaseRes.success("Lấy danh sách điểm danh thành công", result));
    }
}