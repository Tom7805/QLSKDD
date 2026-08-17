package com.qlskdd.service;

import com.qlskdd.entity.CheckInHistory;
import com.qlskdd.entity.Event;
import com.qlskdd.entity.Registration;
import com.qlskdd.entity.User;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.mapper.response.CheckInRes;
import com.qlskdd.repository.CheckInHistoryRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.service.impl.CheckInServiceImpl;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test case B4.1-T5: 5 nhánh điểm danh.
 */
@ExtendWith(MockitoExtension.class)
class CheckInServiceTest {

    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private CheckInHistoryRepository checkInHistoryRepository;

    @Mock
    private UserRepository userRepository;

    private CheckInServiceImpl checkInService;

    @BeforeEach
    void setUp() {
        checkInService = new CheckInServiceImpl(registrationRepository, checkInHistoryRepository, userRepository);
        setCurrentUser("organizer");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Event buildEvent(Long id) {
        Event event = new Event();
        event.setId(id);
        event.setName("Hội thảo AI");
        return event;
    }

    private Registration buildRegistration(Long id, Event event, RegistrationStatus status) {
        User participant = User.builder().id(2L).fullName("Nguyễn Văn A").build();
        return Registration.builder().id(id).event(event).user(participant).status(status).build();
    }

    /**
     * TC1: điểm danh hợp lệ -> 200, DB có đúng 1 bản ghi.
     */
    @Test
    void testCheckIn_HopLe_TaoDungMotBanGhi() {
        Event event = buildEvent(1L);
        Registration registration = buildRegistration(10L, event, RegistrationStatus.ACTIVE);
        User organizer = User.builder().id(1L).username("organizer").build();

        when(registrationRepository.findById(10L)).thenReturn(Optional.of(registration));
        when(checkInHistoryRepository.findByRegistrationId(10L)).thenReturn(Optional.empty());
        when(userRepository.findByUsername("organizer")).thenReturn(Optional.of(organizer));
        when(checkInHistoryRepository.save(any(CheckInHistory.class))).thenAnswer(inv -> {
            CheckInHistory saved = inv.getArgument(0);
            saved.setId(100L);
            saved.setCheckedInAt(LocalDateTime.now());
            return saved;
        });

        CheckInRes result = checkInService.checkIn(10L, 1L);

        assertNotNull(result);
        assertEquals("Nguyễn Văn A", result.getParticipantName());
        verify(checkInHistoryRepository, org.mockito.Mockito.times(1)).save(any(CheckInHistory.class));
    }

    /**
     * TC2: điểm danh lần 2 cùng lượt đăng ký -> 409, không sinh thêm bản ghi.
     */
    @Test
    void testCheckIn_DaDiemDanhTruocDo_Nem409KhongSinhThemBanGhi() {
        Event event = buildEvent(1L);
        Registration registration = buildRegistration(10L, event, RegistrationStatus.ACTIVE);
        CheckInHistory existing = CheckInHistory.builder().id(99L).checkedInAt(LocalDateTime.now()).build();

        when(registrationRepository.findById(10L)).thenReturn(Optional.of(registration));
        when(checkInHistoryRepository.findByRegistrationId(10L)).thenReturn(Optional.of(existing));

        BusinessException ex = assertThrows(BusinessException.class, () -> checkInService.checkIn(10L, 1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("ALREADY_CHECKED_IN", ex.getErrorCode());
        verify(checkInHistoryRepository, never()).save(any());
    }

    /**
     * TC3: người chưa đăng ký (registrationId không tồn tại) -> 404 INVALID_TICKET.
     */
    @Test
    void testCheckIn_ChuaDangKy_Nem404InvalidTicket() {
        when(registrationRepository.findById(999L)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> checkInService.checkIn(999L, 1L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("INVALID_TICKET", ex.getErrorCode());
        verify(checkInHistoryRepository, never()).save(any());
    }

    /**
     * TC4: lượt đăng ký thuộc sự kiện khác -> 400 WRONG_EVENT.
     */
    @Test
    void testCheckIn_SuKienKhac_Nem400WrongEvent() {
        Event event = buildEvent(1L);
        Registration registration = buildRegistration(10L, event, RegistrationStatus.ACTIVE);
        when(registrationRepository.findById(10L)).thenReturn(Optional.of(registration));

        BusinessException ex = assertThrows(BusinessException.class, () -> checkInService.checkIn(10L, 999L));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("WRONG_EVENT", ex.getErrorCode());
        verify(checkInHistoryRepository, never()).save(any());
    }

    /**
     * TC5: lượt đăng ký đã huỷ -> bị từ chối.
     */
    @Test
    void testCheckIn_DaHuy_BiTuChoi() {
        Event event = buildEvent(1L);
        Registration registration = buildRegistration(10L, event, RegistrationStatus.CANCELLED);
        when(registrationRepository.findById(10L)).thenReturn(Optional.of(registration));

        BusinessException ex = assertThrows(BusinessException.class, () -> checkInService.checkIn(10L, 1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(checkInHistoryRepository, never()).save(any());
    }

    /**
     * Test case B4.5-T3: điểm danh theo mã tái sử dụng đúng logic của checkIn(registrationId).
     */
    @Test
    void testCheckInByCode_HopLe_ThanhCong() {
        Event event = buildEvent(1L);
        Registration registration = buildRegistration(10L, event, RegistrationStatus.ACTIVE);
        registration.setCode("ABCD1234");
        User organizer = User.builder().id(1L).username("organizer").build();

        when(registrationRepository.findByCode("ABCD1234")).thenReturn(Optional.of(registration));
        when(checkInHistoryRepository.findByRegistrationId(10L)).thenReturn(Optional.empty());
        when(userRepository.findByUsername("organizer")).thenReturn(Optional.of(organizer));
        when(checkInHistoryRepository.save(any(CheckInHistory.class))).thenAnswer(inv -> {
            CheckInHistory saved = inv.getArgument(0);
            saved.setId(100L);
            saved.setCheckedInAt(LocalDateTime.now());
            return saved;
        });

        CheckInRes result = checkInService.checkInByCode("ABCD1234", 1L);

        assertNotNull(result);
        assertEquals("Nguyễn Văn A", result.getParticipantName());
        verify(checkInHistoryRepository, org.mockito.Mockito.times(1)).save(any(CheckInHistory.class));
    }

    @Test
    void testCheckInByCode_MaKhongTonTai_Nem404InvalidTicket() {
        when(registrationRepository.findByCode("XXXXXXXX")).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> checkInService.checkInByCode("XXXXXXXX", 1L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("INVALID_TICKET", ex.getErrorCode());
        verify(checkInHistoryRepository, never()).save(any());
    }

    @Test
    void testCheckInByCode_SuKienKhac_Nem400WrongEvent() {
        Event event = buildEvent(1L);
        Registration registration = buildRegistration(10L, event, RegistrationStatus.ACTIVE);
        registration.setCode("ABCD1234");
        when(registrationRepository.findByCode("ABCD1234")).thenReturn(Optional.of(registration));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> checkInService.checkInByCode("ABCD1234", 999L));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("WRONG_EVENT", ex.getErrorCode());
        verify(checkInHistoryRepository, never()).save(any());
    }

    private void setCurrentUser(String username) {
        SecurityContext context = new SecurityContextImpl();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(username, null));
        SecurityContextHolder.setContext(context);
    }
}
