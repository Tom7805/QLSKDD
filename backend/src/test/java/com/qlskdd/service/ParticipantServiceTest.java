package com.qlskdd.service;

import com.qlskdd.dto.request.ParticipantReq;
import com.qlskdd.entity.Role;
import com.qlskdd.entity.User;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.exception.DuplicateDataException;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.mapper.response.ParticipantRes;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.repository.RoleRepository;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.service.impl.ParticipantServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test case B3.4-T4.
 */
@ExtendWith(MockitoExtension.class)
class ParticipantServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private ParticipantServiceImpl participantService;

    private Role userRole;

    @BeforeEach
    void setUp() {
        participantService = new ParticipantServiceImpl(userRepository, roleRepository, registrationRepository, passwordEncoder);
        userRole = Role.builder().id(3L).name("ROLE_USER").build();
    }

    private ParticipantReq buildValidReq() {
        ParticipantReq req = new ParticipantReq();
        req.setUsername("newparticipant");
        req.setFullName("Người tham gia mới");
        req.setEmail("participant@qlskdd.com");
        req.setPhone("0912345678");
        req.setPassword("password123");
        return req;
    }

    /**
     * TC1: tạo trùng email -> 409.
     */
    @Test
    void testCreate_TrungEmail_Nem409() {
        ParticipantReq req = buildValidReq();
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail("participant@qlskdd.com")).thenReturn(true);

        DuplicateDataException ex = assertThrows(DuplicateDataException.class,
                () -> participantService.create(req));

        assertEquals("Email đã tồn tại", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void testCreate_TrungUsername_Nem409() {
        ParticipantReq req = buildValidReq();
        when(userRepository.existsByUsername("newparticipant")).thenReturn(true);

        assertThrows(DuplicateDataException.class, () -> participantService.create(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testCreate_HopLe_TraVeDungDuLieu() {
        ParticipantReq req = buildValidReq();
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User saved = inv.getArgument(0);
            saved.setId(20L);
            return saved;
        });

        ParticipantRes result = participantService.create(req);

        assertEquals("newparticipant", result.getUsername());
        assertEquals(0L, result.getRegisteredEventCount());
    }

    /**
     * TC3: xoá người còn đăng ký ACTIVE -> 409.
     */
    @Test
    void testDelete_ConDangKyActive_Nem409() {
        User participant = User.builder().id(7L).username("p1").role(userRole)
                .fullName("Người tham gia").email("p1@qlskdd.com").build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(participant));
        when(registrationRepository.countByUserIdAndStatus(7L, RegistrationStatus.ACTIVE)).thenReturn(2L);

        BusinessException ex = assertThrows(BusinessException.class, () -> participantService.delete(7L));

        assertEquals("Không thể xoá: người này còn 2 lượt đăng ký", ex.getMessage());
        verify(userRepository, never()).delete(any());
    }

    @Test
    void testDelete_KhongConDangKy_XoaThanhCong() {
        User participant = User.builder().id(8L).username("p2").role(userRole)
                .fullName("Người tham gia 2").email("p2@qlskdd.com").build();
        when(userRepository.findById(8L)).thenReturn(Optional.of(participant));
        when(registrationRepository.countByUserIdAndStatus(8L, RegistrationStatus.ACTIVE)).thenReturn(0L);

        participantService.delete(8L);

        verify(userRepository).delete(participant);
    }

    @Test
    void testDelete_KhongPhaiNguoiThamGia_Nem404() {
        Role adminRole = Role.builder().id(1L).name("ROLE_ADMIN").build();
        User admin = User.builder().id(1L).username("admin").role(adminRole).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        assertThrows(ResourceNotFoundException.class, () -> participantService.delete(1L));
    }

    @Test
    void testGetById_KhongTonTai_Nem404() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> participantService.getById(999L));
    }
}
