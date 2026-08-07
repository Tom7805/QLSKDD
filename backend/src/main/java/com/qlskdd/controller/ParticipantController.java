package com.qlskdd.controller;

import com.qlskdd.dto.request.ParticipantReq;
import com.qlskdd.mapper.response.BaseRes;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.mapper.response.ParticipantRes;
import com.qlskdd.service.ParticipantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// B3.4-T3: chỉ ADMIN và ORGANIZER quản lý được người tham gia — người dùng thường (USER)
// nhận 403 ở mọi endpoint dưới đây.
@RestController
@RequestMapping("/api/v1/participants")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
public class ParticipantController {

    private final ParticipantService participantService;

    @GetMapping
    public ResponseEntity<BaseRes<PageRes<ParticipantRes>>> getParticipants(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageRes<ParticipantRes> result = participantService.getParticipants(keyword, pageable);
        return ResponseEntity.ok(BaseRes.success("Lấy danh sách người tham gia thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseRes<ParticipantRes>> getParticipantById(@PathVariable Long id) {
        ParticipantRes result = participantService.getById(id);
        return ResponseEntity.ok(BaseRes.success("Lấy thông tin người tham gia thành công", result));
    }

    @PostMapping
    public ResponseEntity<BaseRes<ParticipantRes>> createParticipant(@Valid @RequestBody ParticipantReq req) {
        ParticipantRes created = participantService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseRes.of(HttpStatus.CREATED.value(), "Tạo người tham gia thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseRes<ParticipantRes>> updateParticipant(@PathVariable Long id,
                                                                        @Valid @RequestBody ParticipantReq req) {
        ParticipantRes updated = participantService.update(id, req);
        return ResponseEntity.ok(BaseRes.success("Cập nhật người tham gia thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseRes<Void>> deleteParticipant(@PathVariable Long id) {
        participantService.delete(id);
        return ResponseEntity.ok(BaseRes.success("Xoá người tham gia thành công", null));
    }
}
