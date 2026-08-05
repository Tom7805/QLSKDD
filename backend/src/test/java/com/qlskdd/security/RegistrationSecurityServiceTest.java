package com.qlskdd.security;

import com.qlskdd.entity.Registration;
import com.qlskdd.entity.User;
import com.qlskdd.repository.RegistrationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * Test case B3.2-T1 (nhánh 403): chỉ chính chủ lượt đăng ký mới được huỷ.
 * Đây là nền tảng cho @PreAuthorize("... or @registrationSecurityService.isOwner(...)")
 * ở RegistrationController — người khác gọi sẽ nhận 403 vì isOwner() trả về false.
 */
@ExtendWith(MockitoExtension.class)
class RegistrationSecurityServiceTest {

    @Mock
    private RegistrationRepository registrationRepository;

    private RegistrationSecurityService securityService;

    @Test
    void testIsOwner_DungChuSoHuu_TraVeTrue() {
        securityService = new RegistrationSecurityService(registrationRepository);
        Registration registration = Registration.builder()
                .id(1L)
                .user(User.builder().username("user1").build())
                .build();
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));

        assertTrue(securityService.isOwner("user1", 1L));
    }

    @Test
    void testIsOwner_NguoiKhac_TraVeFalse() {
        securityService = new RegistrationSecurityService(registrationRepository);
        Registration registration = Registration.builder()
                .id(1L)
                .user(User.builder().username("user1").build())
                .build();
        when(registrationRepository.findById(1L)).thenReturn(Optional.of(registration));

        assertFalse(securityService.isOwner("user2", 1L));
    }

    @Test
    void testIsOwner_KhongTonTai_TraVeFalse() {
        securityService = new RegistrationSecurityService(registrationRepository);
        when(registrationRepository.findById(999L)).thenReturn(Optional.empty());

        assertFalse(securityService.isOwner("user1", 999L));
    }
}
