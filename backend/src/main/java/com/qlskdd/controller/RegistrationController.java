package com.qlskdd.controller;

import com.qlskdd.dto.request.RegistrationReq;
import com.qlskdd.mapper.response.BaseRes;
import com.qlskdd.mapper.response.MyRegistrationRes;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.mapper.response.RegistrationRes;
import com.qlskdd.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

    // B3.2-T5: trang "Sự kiện của tôi" bên FE — danh sách lượt đăng ký của người
    // đang đăng nhập, mới nhất lên trước. Phải khai báo TRƯỚC "/{id}" bên dưới,
    // nếu không Spring sẽ hiểu nhầm "me" là {id}.
    @GetMapping("/me")
    public ResponseEntity<BaseRes<PageRes<MyRegistrationRes>>> getMyRegistrations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "registeredAt"));
        PageRes<MyRegistrationRes> result = registrationService.getMyRegistrations(pageable);
        return ResponseEntity.ok(BaseRes.success("Lấy danh sách đăng ký của tôi thành công", result));
    }

    // B3.2-T3: chỉ chính chủ lượt đăng ký hoặc ADMIN được huỷ (B3.2-T1)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @registrationSecurityService.isOwner(authentication.name, #id)")
    public ResponseEntity<BaseRes<Void>> cancel(@PathVariable Long id) {
        registrationService.cancel(id);
        return ResponseEntity.ok(BaseRes.success("Đã huỷ đăng ký", null));
    }

    // B4.5-T2: chỉ chủ vé hoặc ADMIN/ORGANIZER xem được ảnh QR của 1 lượt đăng ký
    @GetMapping("/{id}/qr")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER') or @registrationSecurityService.isOwner(authentication.name, #id)")
    public ResponseEntity<byte[]> getQrCode(@PathVariable Long id) {
        byte[] png = registrationService.generateQrCode(id);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(png);
    }
}
