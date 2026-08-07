package com.qlskdd.service;

import com.qlskdd.entity.Event;
import com.qlskdd.entity.EventCategory;
import com.qlskdd.entity.Registration;
import com.qlskdd.entity.User;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.exception.DuplicateDataException;
import com.qlskdd.exception.OverbookingException;
import com.qlskdd.mapper.RegistrationMapper;
import com.qlskdd.mapper.response.EventRegistrationsRes;
import com.qlskdd.mapper.response.MyRegistrationRes;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.mapper.response.RegistrationRes;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test case B3.1-T6: 4 nhánh đăng ký.
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
        registrationService = new RegistrationServiceImpl(eventRepository, registrationRepository, userRepository,
                new RegistrationMapper());
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

    private User buildUser() {
        return User.builder().id(2L).username("user1").build();
    }

    @Test
    void testRegister_HopLe_ThanhCong() {
        Event event = buildEvent(EventStatus.OPEN);
        User user = buildUser();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(registrationRepository.existsByEventIdAndUserIdAndStatus(1L, 2L, RegistrationStatus.ACTIVE)).thenReturn(false);
        when(registrationRepository.countByEventIdAndStatus(1L, RegistrationStatus.ACTIVE)).thenReturn(50L);

        Registration savedMock = Registration.builder().id(100L).code("CODE123").build();
        when(registrationRepository.save(any(Registration.class))).thenReturn(savedMock);

        RegistrationRes res = registrationService.register(1L);

        assertNotNull(res);
        assertEquals(100L, res.getRegistrationId());
        assertEquals("CODE123", res.getCode());
        assertEquals("Hội thảo AI", res.getEventName());
        verify(registrationRepository).save(any(Registration.class));
    }

    @Test
    void testRegister_HetCho_Nem409() {
        Event event = buildEvent(EventStatus.OPEN);
        User user = buildUser();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(registrationRepository.existsByEventIdAndUserIdAndStatus(1L, 2L, RegistrationStatus.ACTIVE)).thenReturn(false);
        when(registrationRepository.countByEventIdAndStatus(1L, RegistrationStatus.ACTIVE)).thenReturn(100L); // Bằng capacity

        OverbookingException ex = assertThrows(OverbookingException.class, () -> registrationService.register(1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("OVERBOOKING", ex.getErrorCode());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void testRegister_DangKyTrung_Nem409() {
        Event event = buildEvent(EventStatus.OPEN);
        User user = buildUser();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(registrationRepository.existsByEventIdAndUserIdAndStatus(1L, 2L, RegistrationStatus.ACTIVE)).thenReturn(true);

        DuplicateDataException ex = assertThrows(DuplicateDataException.class, () -> registrationService.register(1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("DUPLICATE_REGISTRATION", ex.getErrorCode());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void testRegister_SuKienDaDong_Nem409() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(buildEvent(EventStatus.CLOSED)));

        BusinessException ex = assertThrows(BusinessException.class, () -> registrationService.register(1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("EVENT_CLOSED", ex.getErrorCode());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void testRegister_SuKienDaDienRa_Nem409() {
        Event event = buildEvent(EventStatus.OPEN);
        event.setEndAt(LocalDateTime.now().minusDays(1)); // Đã kết thúc
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));

        BusinessException ex = assertThrows(BusinessException.class, () -> registrationService.register(1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("EVENT_ENDED", ex.getErrorCode());
        verify(registrationRepository, never()).save(any());
    }

    /**
     * Test case B3.2-T4: huỷ đăng ký.
     * TC2 (huỷ của người khác -> 403) được chặn ở @PreAuthorize/RegistrationSecurityService
     * của controller, không nằm trong RegistrationServiceImpl nên xem
     * RegistrationSecurityServiceTest. TC3 (đã điểm danh -> 409) tạm chưa có test vì
     * tính năng điểm danh (B4.1) chưa được triển khai.
     */
    @Test
    void testCancel_HopLe_ChuyenSangCancelled() {
        Event event = buildEvent(EventStatus.OPEN);
        event.setStartAt(LocalDateTime.now().plusDays(5));
        Registration registration = Registration.builder()
                .id(10L)
                .event(event)
                .status(RegistrationStatus.ACTIVE)
                .code("CODE123")
                .build();
        when(registrationRepository.findById(10L)).thenReturn(Optional.of(registration));

        registrationService.cancel(10L);

        assertEquals(RegistrationStatus.CANCELLED, registration.getStatus());
        verify(registrationRepository).save(registration);
    }

    @Test
    void testCancel_SuKienDaBatDau_Nem409() {
        Event event = buildEvent(EventStatus.OPEN);
        event.setStartAt(LocalDateTime.now().minusHours(1)); // Đã bắt đầu
        Registration registration = Registration.builder()
                .id(11L)
                .event(event)
                .status(RegistrationStatus.ACTIVE)
                .build();
        when(registrationRepository.findById(11L)).thenReturn(Optional.of(registration));

        BusinessException ex = assertThrows(BusinessException.class, () -> registrationService.cancel(11L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void testCancel_DaHuyTruocDo_Nem409() {
        Registration registration = Registration.builder()
                .id(12L)
                .event(buildEvent(EventStatus.OPEN))
                .status(RegistrationStatus.CANCELLED)
                .build();
        when(registrationRepository.findById(12L)).thenReturn(Optional.of(registration));

        BusinessException ex = assertThrows(BusinessException.class, () -> registrationService.cancel(12L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void testCancel_KhongTonTai_Nem404() {
        when(registrationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(com.qlskdd.exception.ResourceNotFoundException.class,
                () -> registrationService.cancel(999L));
    }

    /**
     * Test case B3.2-T5: GET /registrations/me — trang "Sự kiện của tôi".
     */
    @Test
    void testGetMyRegistrations_TraDanhSachCuaChinhUserDangDangNhap() {
        Event event = buildEvent(EventStatus.OPEN);
        Registration registration = Registration.builder()
                .id(20L)
                .event(event)
                .status(RegistrationStatus.ACTIVE)
                .code("CODE20")
                .registeredAt(LocalDateTime.now())
                .build();
        Pageable pageable = PageRequest.of(0, 10);
        when(registrationRepository.findByUserUsernameOrderByRegisteredAtDesc("user1", pageable))
                .thenReturn(new PageImpl<>(List.of(registration), pageable, 1));

        PageRes<MyRegistrationRes> result = registrationService.getMyRegistrations(pageable);

        assertEquals(1, result.getTotalElements());
        MyRegistrationRes item = result.getContent().get(0);
        assertEquals(20L, item.getRegistrationId());
        assertEquals("Hội thảo AI", item.getEventName());
        assertEquals(RegistrationStatus.ACTIVE, item.getRegistrationStatus());
        assertTrue(item.isCanCancel());
    }

    @Test
    void testGetMyRegistrations_SuKienDaBatDau_CanCancelFalse() {
        Event event = buildEvent(EventStatus.OPEN);
        event.setStartAt(LocalDateTime.now().minusHours(1));
        Registration registration = Registration.builder()
                .id(21L)
                .event(event)
                .status(RegistrationStatus.ACTIVE)
                .code("CODE21")
                .registeredAt(LocalDateTime.now())
                .build();
        Pageable pageable = PageRequest.of(0, 10);
        when(registrationRepository.findByUserUsernameOrderByRegisteredAtDesc("user1", pageable))
                .thenReturn(new PageImpl<>(List.of(registration), pageable, 1));

        PageRes<MyRegistrationRes> result = registrationService.getMyRegistrations(pageable);

        assertFalse(result.getContent().get(0).isCanCancel());
    }

    /**
     * Test case B3.3-T3 (TC3): phân trang đúng totalElements — kiểm tra ở tầng service
     * vì @PreAuthorize (TC1/TC2 ORGANIZER 200 / USER 403) chỉ chạy qua MockMvc, xem
     * EventControllerTest.xemDanhSachDangKy_Organizer_traVe200 / _User_traVe403.
     */
    @Test
    void testGetRegistrationsByEvent_PhanTrang_TotalElementsDung() {
        Event event = buildEvent(EventStatus.OPEN);
        event.setCapacity(60);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));

        User participant = User.builder().id(5L).fullName("Nguyễn Văn A").email("a@qlskdd.com").phone("0900000000").build();
        Registration r1 = Registration.builder().id(1L).user(participant).status(RegistrationStatus.ACTIVE)
                .registeredAt(LocalDateTime.now()).build();
        Registration r2 = Registration.builder().id(2L).user(participant).status(RegistrationStatus.ACTIVE)
                .registeredAt(LocalDateTime.now()).build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<Registration> page = new PageImpl<>(List.of(r1, r2), pageable, 25);
        when(registrationRepository.findByEventId(1L, pageable)).thenReturn(page);
        when(registrationRepository.countByEventIdAndStatus(1L, RegistrationStatus.ACTIVE)).thenReturn(25L);

        EventRegistrationsRes res = registrationService.getRegistrationsByEvent(1L, pageable);

        assertEquals(25L, res.getRegistrations().getTotalElements());
        assertEquals(3, res.getRegistrations().getTotalPages());
        assertEquals(2, res.getRegistrations().getContent().size());
        assertEquals(25L, res.getSummary().getTotalRegistered());
        assertEquals(60, res.getSummary().getCapacity());
        assertEquals("Nguyễn Văn A", res.getRegistrations().getContent().get(0).getFullName());
    }

    @Test
    void testGetRegistrationsByEvent_SuKienKhongTonTai_Nem404() {
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(com.qlskdd.exception.ResourceNotFoundException.class,
                () -> registrationService.getRegistrationsByEvent(999L, PageRequest.of(0, 10)));
    }

    private void setCurrentUser(String username) {
        SecurityContext context = new SecurityContextImpl();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(username, null));
        SecurityContextHolder.setContext(context);
    }
}
