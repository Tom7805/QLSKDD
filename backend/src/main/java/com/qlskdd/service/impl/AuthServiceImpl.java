package com.qlskdd.service.impl;

import com.qlskdd.dto.request.LoginReq;
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
        LoginRes.UserLoginInfo userInfo = LoginRes.UserLoginInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .build();

        return LoginRes.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(userInfo)
                .build();
    }

    @Override
    public LoginRes.UserLoginInfo getCurrentUserInfo(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản"));

        return LoginRes.UserLoginInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .build();
    }
}