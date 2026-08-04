package com.qlskdd.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qlskdd.dto.request.ChangePasswordReq;
import com.qlskdd.dto.request.UserReq;
import com.qlskdd.entity.Role;
import com.qlskdd.entity.User;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.exception.DuplicateDataException;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.mapper.UserMapper;
import com.qlskdd.mapper.response.UserRes;
import com.qlskdd.repository.RoleRepository;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.service.impl.UserServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test case B1.4-T5: quản lý tài khoản.
 * UserMapper không mock (dùng bản thật) vì đây là logic ánh xạ đơn giản, không phụ
 * thuộc gì khác — mock nó chỉ khiến test TC4 (kiểm tra response không lộ password)
 * trở nên vô nghĩa.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private final UserMapper userMapper = new UserMapper();

    private UserServiceImpl userService;

    private Role userRole;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(userRepository, roleRepository, userMapper, passwordEncoder);
        userRole = Role.builder().id(3L).name("ROLE_USER").build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private UserReq buildValidReq() {
        UserReq req = new UserReq();
        req.setUsername("newuser");
        req.setFullName("Người dùng mới");
        req.setEmail("newuser@qlskdd.com");
        req.setPhone("0912345678");
        req.setRoleId(3L);
        req.setPassword("password123");
        return req;
    }

    @Test
    void testCreate_TC1_TrungUsername_NemDuplicateDataException() {
        UserReq req = buildValidReq();
        when(userRepository.existsByUsername("newuser")).thenReturn(true);

        assertThrows(DuplicateDataException.class, () -> userService.create(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testCreate_TrungEmail_NemDuplicateDataException() {
        UserReq req = buildValidReq();
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail("newuser@qlskdd.com")).thenReturn(true);

        assertThrows(DuplicateDataException.class, () -> userService.create(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testToggleStatus_TC3_KhoaTaiKhoanNguoiKhac_EnabledFalse() {
        User target = User.builder()
                .id(5L).username("organizer").enabled(true).role(userRole)
                .fullName("Ban tổ chức").email("organizer@qlskdd.com")
                .build();

        setCurrentUser("admin"); // người đang đăng nhập khác với tài khoản bị khoá
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserRes result = userService.toggleStatus(5L);

        assertFalse(result.getEnabled());
    }

    @Test
    void testToggleStatus_AdminTuKhoaChinhMinh_BiTuChoi() {
        User self = User.builder()
                .id(1L).username("admin").enabled(true).role(userRole)
                .fullName("Quản trị viên").email("admin@qlskdd.com")
                .build();

        setCurrentUser("admin");
        when(userRepository.findById(1L)).thenReturn(Optional.of(self));

        assertThrows(BusinessException.class, () -> userService.toggleStatus(1L));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testCreate_TC4_ResponseKhongChuaTruongPassword() throws Exception {
        UserReq req = buildValidReq();
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findById(3L)).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        UserRes result = userService.create(req);

        // UserRes vốn không khai báo field password nên đảm bảo ở mức compile-time,
        // nhưng vẫn serialize để kiểm chứng bằng dữ liệu thật thay vì suy luận suông
        String json = new ObjectMapper().writeValueAsString(result);
        assertFalse(json.toLowerCase().contains("password"),
                "Response DTO tuyệt đối không được chứa trường password");
        assertEquals("newuser", result.getUsername());
    }

    /**
     * Test case B1.5-T3: đổi mật khẩu.
     */
    private ChangePasswordReq buildChangePasswordReq(String oldPassword, String newPassword, String confirmPassword) {
        ChangePasswordReq req = new ChangePasswordReq();
        req.setOldPassword(oldPassword);
        req.setNewPassword(newPassword);
        req.setConfirmPassword(confirmPassword);
        return req;
    }

    @Test
    void testChangePassword_TC1_MatKhauCuSai_NemBusinessException() {
        User user = User.builder()
                .id(1L).username("user1").password("$2a$10$oldHashed").enabled(true).role(userRole)
                .fullName("Người dùng 1").email("user1@qlskdd.com")
                .build();

        setCurrentUser("user1");
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("saiMatKhauCu", "$2a$10$oldHashed")).thenReturn(false);

        ChangePasswordReq req = buildChangePasswordReq("saiMatKhauCu", "matKhauMoi123", "matKhauMoi123");

        assertThrows(BusinessException.class, () -> userService.changePassword(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testChangePassword_KhongTimThayTaiKhoan_NemResourceNotFoundException() {
        setCurrentUser("khongTonTai");
        when(userRepository.findByUsername("khongTonTai")).thenReturn(Optional.empty());

        ChangePasswordReq req = buildChangePasswordReq("matKhauCu123", "matKhauMoi123", "matKhauMoi123");

        assertThrows(ResourceNotFoundException.class, () -> userService.changePassword(req));
    }

    @Test
    void testChangePassword_TC3_DoiThanhCong_MatKhauTrongDbDaDoiVaVanBamBCrypt() {
        User user = User.builder()
                .id(1L).username("user1").password("$2a$10$oldHashed").enabled(true).role(userRole)
                .fullName("Người dùng 1").email("user1@qlskdd.com")
                .build();

        setCurrentUser("user1");
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("matKhauCu123", "$2a$10$oldHashed")).thenReturn(true);
        when(passwordEncoder.encode("matKhauMoi123")).thenReturn("$2a$10$newHashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        ChangePasswordReq req = buildChangePasswordReq("matKhauCu123", "matKhauMoi123", "matKhauMoi123");

        userService.changePassword(req);

        assertEquals("$2a$10$newHashed", user.getPassword());
        assertFalse(user.getPassword().equals("matKhauMoi123"),
                "Mật khẩu mới phải được BCrypt băm trước khi lưu, không lưu dạng chữ thô");
        verify(userRepository).save(user);
    }

    @Test
    void testChangePassword_TC4_DangNhapDuocBangMatKhauMoiSauKhiDoi() {
        // TC4 xác nhận đăng nhập bằng mật khẩu mới thành công đã được đảm bảo gián tiếp:
        // AuthServiceImpl xác thực bằng passwordEncoder.matches(rawPassword, user.getPassword());
        // ở đây ta kiểm chứng rằng sau changePassword(), matches(mật khẩu mới, hash đã lưu)
        // trả về true — đúng hành vi mà AuthenticationManager sẽ dùng khi đăng nhập lại.
        User user = User.builder()
                .id(1L).username("user1").password("$2a$10$oldHashed").enabled(true).role(userRole)
                .fullName("Người dùng 1").email("user1@qlskdd.com")
                .build();

        setCurrentUser("user1");
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("matKhauCu123", "$2a$10$oldHashed")).thenReturn(true);
        when(passwordEncoder.encode("matKhauMoi123")).thenReturn("$2a$10$newHashed");
        when(passwordEncoder.matches("matKhauMoi123", "$2a$10$newHashed")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.changePassword(buildChangePasswordReq("matKhauCu123", "matKhauMoi123", "matKhauMoi123"));

        assertEquals(true, passwordEncoder.matches("matKhauMoi123", user.getPassword()));
    }

    private void setCurrentUser(String username) {
        SecurityContext context = new SecurityContextImpl();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(username, null));
        SecurityContextHolder.setContext(context);
    }
}
