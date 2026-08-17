package com.qlskdd.service;

import com.qlskdd.dto.request.LoginReq;
import com.qlskdd.dto.request.ProfileReq;
import com.qlskdd.entity.Role;
import com.qlskdd.entity.User;
import com.qlskdd.mapper.response.LoginRes;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.security.JwtProvider;
import com.qlskdd.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    private User mockUser;
    private Role mockRole;

    @BeforeEach
    void setUp() {
        mockRole = Role.builder().id(1L).name("ROLE_ADMIN").build();
        mockUser = User.builder()
                .id(1L)
                .username("admin")
                .password("$2a$10$encodedPassword")
                .fullName("Quản trị viên")
                .email("admin@qlskdd.com")
                .enabled(true)
                .role(mockRole)
                .build();
    }

    @Test
    void testLogin_TC1_Success() {
        // Given
        LoginReq request = new LoginReq();
        request.setUsername("admin");
        request.setPassword("admin123");

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtProvider.generateToken(authentication)).thenReturn("mock-jwt-token");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(mockUser));

        // When
        LoginRes response = authService.login(request);

        // Then
        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertNotNull(response.getUser());
        assertEquals("admin", response.getUser().getUsername());
        verify(authenticationManager, times(1)).authenticate(any());
    }

    @Test
    void testLogin_TC2_BadCredentials() {
        // Given
        LoginReq request = new LoginReq();
        request.setUsername("admin");
        request.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Sai tên đăng nhập hoặc mật khẩu"));

        // When & Then
        assertThrows(BadCredentialsException.class, () -> authService.login(request));
        verify(jwtProvider, never()).generateToken(any());
    }

    @Test
    void testLogin_TC3_UsernameNotFound() {
        // Given
        LoginReq request = new LoginReq();
        request.setUsername("notfound");
        request.setPassword("admin123");

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtProvider.generateToken(authentication)).thenReturn("mock-jwt-token");
        // Giả lập trong DB không tìm thấy user
        when(userRepository.findByUsername("notfound")).thenReturn(Optional.empty());

        // When & Then
        assertThrows(UsernameNotFoundException.class, () -> authService.login(request));
    }

    @Test
    void testLogin_TC4_AccountDisabled() {
        // Given
        mockUser.setEnabled(false); // Tài khoản bị khóa / vô hiệu hóa
        LoginReq request = new LoginReq();
        request.setUsername("admin");
        request.setPassword("admin123");

        // Nếu hệ thống hoặc AuthenticationManager từ chối tài khoản disabled
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Tài khoản đã bị khóa"));

        // When & Then
        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    /**
     * Sửa hồ sơ chỉ được đụng tới họ tên / điện thoại / ảnh. username, email và role là
     * bất biến ở luồng này — nếu ai đó thêm chúng vào ProfileReq sau này, test sẽ đỏ.
     */
    @Test
    void testUpdateProfile_ChiSuaCacTruongChoPhep() {
        ProfileReq request = new ProfileReq();
        request.setFullName("  Tên Mới  ");
        request.setPhone("0900123456");
        request.setAvatar("preset:violet");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        LoginRes.UserLoginInfo result = authService.updateProfile("admin", request);

        assertEquals("Tên Mới", result.getFullName(), "Họ tên phải được cắt khoảng trắng thừa");
        assertEquals("0900123456", result.getPhone());
        assertEquals("preset:violet", result.getAvatar());
        // Không đổi: định danh đăng nhập và quyền
        assertEquals("admin", result.getUsername());
        assertEquals("admin@qlskdd.com", result.getEmail());
        assertEquals("ROLE_ADMIN", result.getRole());
    }

    /**
     * Form gửi chuỗi rỗng khi người dùng xoá trắng ô -> lưu null, tránh cột users vừa có
     * null vừa có chuỗi rỗng cho cùng một ý nghĩa "chưa có dữ liệu".
     */
    @Test
    void testUpdateProfile_ChuoiRong_LuuThanhNull() {
        mockUser.setPhone("0123456789");
        mockUser.setAvatar("preset:sky");

        ProfileReq request = new ProfileReq();
        request.setFullName("Quản trị viên");
        request.setPhone("");
        request.setAvatar("");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        LoginRes.UserLoginInfo result = authService.updateProfile("admin", request);

        assertNull(result.getPhone());
        assertNull(result.getAvatar());
    }

    @Test
    void testUpdateProfile_KhongTonTaiTaiKhoan_NemLoi() {
        ProfileReq request = new ProfileReq();
        request.setFullName("Ai đó");

        when(userRepository.findByUsername("khong-ton-tai")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> authService.updateProfile("khong-ton-tai", request));
        verify(userRepository, never()).save(any());
    }
}
