package com.qlskdd.controller;

import com.qlskdd.dto.request.CheckInByCodeReq;
import com.qlskdd.dto.request.CheckInReq;
import com.qlskdd.mapper.response.BaseRes;
import com.qlskdd.mapper.response.CheckInRes;
import com.qlskdd.service.CheckInService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// B4.1-T4: chỉ ADMIN và ORGANIZER được điểm danh — người khác nhận 403
@RestController
@RequestMapping("/api/v1/check-in")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
public class CheckInController {

    private final CheckInService checkInService;

    @PostMapping
    public ResponseEntity<BaseRes<CheckInRes>> checkIn(@Valid @RequestBody CheckInReq req) {
        CheckInRes result = checkInService.checkIn(req.getRegistrationId(), req.getEventId());
        return ResponseEntity.ok(BaseRes.success("Điểm danh thành công", result));
    }

    // B4.5-T3: điểm danh bằng mã — quét QR (B4.5-T2 sinh QR chứa đúng code này) hoặc
    // nhập tay khi camera hỏng, tái sử dụng đúng logic của POST /check-in ở trên.
    @PostMapping("/scan")
    public ResponseEntity<BaseRes<CheckInRes>> checkInByCode(@Valid @RequestBody CheckInByCodeReq req) {
        CheckInRes result = checkInService.checkInByCode(req.getCode(), req.getEventId());
        return ResponseEntity.ok(BaseRes.success("Điểm danh thành công", result));
    }
}
