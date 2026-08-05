package com.qlskdd.controller;

import com.qlskdd.dto.request.RegistrationReq;
import com.qlskdd.mapper.response.BaseRes;
import com.qlskdd.mapper.response.RegistrationRes;
import com.qlskdd.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping
    public ResponseEntity<BaseRes<RegistrationRes>> register(@Valid @RequestBody RegistrationReq request) {
        RegistrationRes response = registrationService.register(request.getEventId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseRes.of(HttpStatus.CREATED.value(), "Đăng ký thành công", response));
    }

    // B3.2-T3: chỉ chính chủ lượt đăng ký hoặc ADMIN được huỷ (B3.2-T1)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @registrationSecurityService.isOwner(authentication.name, #id)")
    public ResponseEntity<BaseRes<Void>> cancel(@PathVariable Long id) {
        registrationService.cancel(id);
        return ResponseEntity.ok(BaseRes.success("Đã huỷ đăng ký", null));
    }
}
