package com.qlskdd.service;

import com.qlskdd.entity.Event;
import com.qlskdd.entity.EventCategory;
import com.qlskdd.entity.Registration;
import com.qlskdd.entity.User;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.service.impl.RegistrationServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test case B2.4-T3 (phần chặn đăng ký theo trạng thái sự kiện).
 */
@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private UserRepository userRepository;

    private RegistrationServiceImpl registrationService;

    @BeforeEach
    void setUp() {
        registrationService = new RegistrationServiceImpl(eventRepository, registrationRepository, userRepository);
        setCurrentUser("user1");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Event buildEvent(EventStatus status) {
        Event event = new Event();
        event.setId(1L);
        event.setName("Hội thảo AI");
        event.setLocation("Hội trường A");
        event.setCapacity(100);
        event.setCategory(EventCategory.builder().id(1L).name("Hội thảo").build());
        event.setStartAt(LocalDateTime.now().plusDays(5));
        event.setEndAt(LocalDateTime.now().plusDays(5).plusHours(3));
        event.setStatus(status);
        event.setCreatedBy("organizer");
        return event;
    }

    @Test
    void testRegister_TC1_SuKienDaDong_Nem409() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(buildEvent(EventStatus.CLOSED)));

        BusinessException ex = assertThrows(BusinessException.class, () -> registrationService.register(1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Sự kiện đã đóng đăng ký", ex.getMessage());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void testRegister_TC2_SuKienDaHuy_Nem409() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(buildEvent(EventStatus.CANCELLED)));

        BusinessException ex = assertThrows(BusinessException.class, () -> registrationService.register(1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void testRegister_SuKienDangMo_DangKyThanhCong() {
        Event event = buildEvent(EventStatus.OPEN);
        User user = User.builder().id(2L).username("user1").build();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));

        registrationService.register(1L);

        verify(registrationRepository).save(any(Registration.class));
    }

    private void setCurrentUser(String username) {
        SecurityContext context = new SecurityContextImpl();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(username, null));
        SecurityContextHolder.setContext(context);
    }
}
