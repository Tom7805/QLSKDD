package com.qlskdd.service.impl;

import com.qlskdd.dto.request.LoginReq;
import com.qlskdd.dto.request.ProfileReq;
import com.qlskdd.entity.User;
import com.qlskdd.mapper.response.LoginRes;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    public LoginRes login(LoginReq request) {
        // 1. Xác thực thông tin username và password qua AuthenticationManager
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // 2. Sinh JWT token
        String token = jwtProvider.generateToken(authentication);

        // 3. Lấy thông tin chi tiết user từ database
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản"));

        // 4. Đóng gói vào LoginRes DTO
        LoginRes.UserLoginInfo userInfo = toUserInfo(user);

        return LoginRes.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(userInfo)
                .build();
    }

    @Override
    public LoginRes.UserLoginInfo getCurrentUserInfo(String username) {
        return toUserInfo(findByUsernameOrThrow(username));
    }

    /**
     * Người dùng tự sửa hồ sơ của mình. Chỉ 3 trường được đụng tới (họ tên, điện thoại,
     * ảnh) — username/email/role cố ý nằm ngoài tầm với, xem ProfileReq để biết lý do.
     * Trả về thông tin sau khi lưu để client cập nhật ngay mà không phải gọi lại /me.
     */
    @Override
    @Transactional
    public LoginRes.UserLoginInfo updateProfile(String username, ProfileReq request) {
        User user = findByUsernameOrThrow(username);

        user.setFullName(request.getFullName().trim());
        // Chuỗi rỗng từ form nghĩa là "xoá số điện thoại" -> lưu null cho sạch dữ liệu,
        // không lưu chuỗi rỗng lẫn lộn với null trong cùng một cột
        user.setPhone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null);
        user.setAvatar(StringUtils.hasText(request.getAvatar()) ? request.getAvatar() : null);

        return toUserInfo(userRepository.save(user));
    }

    private User findByUsernameOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản"));
    }

    private LoginRes.UserLoginInfo toUserInfo(User user) {
        return LoginRes.UserLoginInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .role(user.getRole().getName())
                .build();
    }
}