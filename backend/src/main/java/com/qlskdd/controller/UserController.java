package com.qlskdd.controller;

import com.qlskdd.dto.request.UserReq;
import com.qlskdd.mapper.response.BaseRes;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.mapper.response.UserRes;
import com.qlskdd.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Chỉ ADMIN mới gọi được toàn bộ endpoint dưới đây — đã chặn sẵn ở tầng URL trong
// SecurityConfig ("/api/v1/users/**" -> hasRole("ADMIN"), xem B1.3-T2), nên không cần
// lặp lại @PreAuthorize ở đây.
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<BaseRes<PageRes<UserRes>>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageRes<UserRes> result = userService.getUsers(keyword, pageable);
        return ResponseEntity.ok(BaseRes.success("Lấy danh sách tài khoản thành công", result));
    }

    @PostMapping
    public ResponseEntity<BaseRes<UserRes>> createUser(@Valid @RequestBody UserReq req) {
        UserRes created = userService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseRes.of(HttpStatus.CREATED.value(), "Tạo tài khoản thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseRes<UserRes>> updateUser(@PathVariable Long id, @Valid @RequestBody UserReq req) {
        UserRes updated = userService.update(id, req);
        return ResponseEntity.ok(BaseRes.success("Cập nhật tài khoản thành công", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BaseRes<UserRes>> toggleStatus(@PathVariable Long id) {
        UserRes updated = userService.toggleStatus(id);
        return ResponseEntity.ok(BaseRes.success("Cập nhật trạng thái tài khoản thành công", updated));
    }
}
