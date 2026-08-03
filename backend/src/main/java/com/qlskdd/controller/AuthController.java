package com.qlskdd.controller;

import com.qlskdd.dto.request.LoginReq;
import com.qlskdd.mapper.response.BaseRes;
import com.qlskdd.mapper.response.LoginRes;
import com.qlskdd.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; // <-- Nhớ import Authentication
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<BaseRes<LoginRes>> login(@Valid @RequestBody LoginReq request) {
        LoginRes response = authService.login(request);
        return ResponseEntity.ok(BaseRes.success("Đăng nhập thành công", response));
    }

    // Thêm endpoint GET /me cho task B1.1-T8[cite: 1]
    @GetMapping("/me")
    public ResponseEntity<BaseRes<LoginRes.UserLoginInfo>> getCurrentUser(Authentication authentication) {
        // /auth/me nằm trong permitAll nên khi thiếu/sai token, Spring Security coi là
        // khách vãng lai (anonymous) — HttpServletRequest.getUserPrincipal() (cơ chế Spring
        // MVC dùng để bơm Authentication vào đây) luôn trả về null cho anonymous, KHÔNG
        // trả về AnonymousAuthenticationToken như khi đọc trực tiếp từ SecurityContextHolder.
        if (authentication == null) {
            throw new UsernameNotFoundException("Bạn cần đăng nhập để thực hiện thao tác này");
        }
        String username = authentication.getName();
        LoginRes.UserLoginInfo userInfo = authService.getCurrentUserInfo(username);
        return ResponseEntity.ok(BaseRes.success("Lấy thông tin người dùng thành công", userInfo));
    }

    // Endpoint đăng xuất cho task B1.2-T1
    @PostMapping("/logout")
    public ResponseEntity<BaseRes<Void>> logout() {
        // Xóa thông tin xác thực trong SecurityContextHolder
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(BaseRes.success("Đã đăng xuất", null));
    }
}