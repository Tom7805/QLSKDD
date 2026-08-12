package com.qlskdd.service;

import com.qlskdd.dto.request.EventReq;
import com.qlskdd.dto.request.EventStatusReq;
import com.qlskdd.entity.Event;
import com.qlskdd.entity.EventCategory;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.mapper.EventMapper;
import com.qlskdd.mapper.response.EventDetailRes;
import com.qlskdd.mapper.response.EventRes;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.repository.CategoryRepository;
import com.qlskdd.repository.CheckInHistoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.service.impl.EventServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test case B2.2-T6 và B2.3-T3: tạo & sửa sự kiện.
 * EventMapper không mock (dùng bản thật) vì chỉ là logic ánh xạ đơn giản.
 */
@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private CheckInHistoryRepository checkInHistoryRepository;

    private final EventMapper eventMapper = new EventMapper();

    private EventServiceImpl eventService;

    private EventCategory category;

    @BeforeEach
    void setUp() {
        eventService = new EventServiceImpl(eventRepository, categoryRepository, checkInHistoryRepository,
                registrationRepository, eventMapper);
        category = EventCategory.builder().id(1L).name("Hội thảo").build();
        setCurrentUser("organizer");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private EventReq buildValidReq() {
        EventReq req = new EventReq();
        req.setName("Hội thảo AI 2026");
        req.setDescription("Chia sẻ kiến thức AI");
        req.setLocation("Hội trường A");
        req.setCapacity(100);
        req.setStartAt(LocalDateTime.now().plusDays(5));
        req.setEndAt(LocalDateTime.now().plusDays(5).plusHours(3));
        req.setCategoryId(1L);
        return req;
    }

    @Test
    void testCreate_TC1_DuLieuHopLe_LuuVoiStatusOpenVaTraVeEventDetailRes() {
        EventReq req = buildValidReq();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> {
            Event saved = inv.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        EventDetailRes result = eventService.create(req);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        assertEquals(EventStatus.OPEN, captor.getValue().getStatus());
        assertEquals("organizer", captor.getValue().getCreatedBy());
        assertEquals(EventStatus.OPEN, result.getStatus());
        assertEquals("Hội thảo AI 2026", result.getName());
    }

    @Test
    void testCreate_TC5_CategoryIdKhongTonTai_NemResourceNotFoundException() {
        EventReq req = buildValidReq();
        req.setCategoryId(999L);
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> eventService.create(req));
        verify(eventRepository, never()).save(any());
    }

    private Event buildExistingEvent() {
        Event event = new Event();
        event.setId(1L);
        event.setName("Hội thảo cũ");
        event.setLocation("Hội trường B");
        event.setCapacity(50);
        event.setCategory(category);
        event.setStartAt(LocalDateTime.now().plusDays(1));
        event.setEndAt(LocalDateTime.now().plusDays(1).plusHours(2));
        event.setStatus(EventStatus.OPEN);
        event.setCreatedBy("organizer");
        return event;
    }

    /**
     * Test case B2.3-T3.
     */
    @Test
    void testUpdate_TC1_SuaHopLe_DuLieuTrongDbDaDoi() {
        Event existing = buildExistingEvent();
        EventReq req = buildValidReq();
        req.setName("Hội thảo AI 2026 (đã sửa)");

        when(eventRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(registrationRepository.countByEventIdAndStatus(1L, RegistrationStatus.ACTIVE)).thenReturn(0L);
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        EventDetailRes result = eventService.update(1L, req);

        assertEquals("Hội thảo AI 2026 (đã sửa)", result.getName());
        assertEquals("Hội thảo AI 2026 (đã sửa)", existing.getName());
        assertEquals(100, existing.getCapacity());
        verify(eventRepository).save(existing);
    }

    @Test
    void testUpdate_TC2_SuKienCo10DangKy_HaCapacityXuong5_Nem409() {
        Event existing = buildExistingEvent();
        EventReq req = buildValidReq();
        req.setCapacity(5);

        when(eventRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(registrationRepository.countByEventIdAndStatus(1L, RegistrationStatus.ACTIVE)).thenReturn(10L);

        BusinessException ex = assertThrows(BusinessException.class, () -> eventService.update(1L, req));

        assertEquals(org.springframework.http.HttpStatus.CONFLICT, ex.getStatus());
        verify(eventRepository, never()).save(any());
    }

    /**
     * Test case B2.4-T3: đổi trạng thái sự kiện.
     */
    @Test
    void testChangeStatus_OpenSangClosed_ThanhCong() {
        Event existing = buildExistingEvent();
        existing.setStatus(EventStatus.OPEN);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        EventStatusReq req = new EventStatusReq();
        req.setStatus(EventStatus.CLOSED);

        EventDetailRes result = eventService.changeStatus(1L, req);

        assertEquals(EventStatus.CLOSED, result.getStatus());
        assertEquals(EventStatus.CLOSED, existing.getStatus());
    }

    @Test
    void testChangeStatus_TC3_ChuyenCancelledSangOpen_Nem400() {
        Event existing = buildExistingEvent();
        existing.setStatus(EventStatus.CANCELLED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(existing));

        EventStatusReq req = new EventStatusReq();
        req.setStatus(EventStatus.OPEN);

        BusinessException ex = assertThrows(BusinessException.class, () -> eventService.changeStatus(1L, req));

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(eventRepository, never()).save(any());
    }

    /**
     * Test case B2.5-T3: danh sách & chi tiết sự kiện.
     */
    @Test
    void testGetAllEvents_TC1_25SuKien_Size10_TongPages3TrangDauCo10PhanTu() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "startAt"));
        List<Event> tenEvents = new ArrayList<>();
        for (long i = 1; i <= 10; i++) {
            Event e = new Event();
            e.setId(i);
            e.setName("Sự kiện " + i);
            e.setLocation("Địa điểm " + i);
            e.setStartAt(LocalDateTime.now().plusDays(i));
            e.setEndAt(LocalDateTime.now().plusDays(i).plusHours(2));
            e.setStatus(EventStatus.OPEN);
            tenEvents.add(e);
        }
        Page<Event> page = new PageImpl<>(tenEvents, pageable, 25);
        when(eventRepository.findAll(pageable)).thenReturn(page);
        when(registrationRepository.countGroupedByEventIdsAndStatus(any(), eq(RegistrationStatus.ACTIVE)))
                .thenReturn(Collections.emptyList());
        when(checkInHistoryRepository.countGroupedByEventIds(any())).thenReturn(Collections.emptyList());

        PageRes<EventRes> result = eventService.getAllEvents(pageable);

        assertEquals(3, result.getTotalPages());
        assertEquals(10, result.getContent().size());
        assertEquals(25, result.getTotalElements());
    }

    /**
     * Test case B4.3-T4: attendanceRate ở danh sách sự kiện — cùng công thức với chi
     * tiết sự kiện (75/60 đăng ký -> 45 đã điểm danh -> 75.0%; sự kiện chưa ai đăng ký
     * -> 0.0, không lỗi chia 0).
     */
    @Test
    void testGetAllEvents_B43T4_TinhAttendanceRateChoTungSuKienTrongTrang() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "startAt"));
        Event e1 = new Event();
        e1.setId(1L);
        e1.setName("Sự kiện 1");
        e1.setLocation("Địa điểm 1");
        e1.setStartAt(LocalDateTime.now().plusDays(1));
        e1.setEndAt(LocalDateTime.now().plusDays(1).plusHours(2));
        e1.setStatus(EventStatus.OPEN);
        Event e2 = new Event();
        e2.setId(2L);
        e2.setName("Sự kiện 2");
        e2.setLocation("Địa điểm 2");
        e2.setStartAt(LocalDateTime.now().plusDays(2));
        e2.setEndAt(LocalDateTime.now().plusDays(2).plusHours(2));
        e2.setStatus(EventStatus.OPEN);
        Page<Event> page = new PageImpl<>(List.of(e1, e2), pageable, 2);
        when(eventRepository.findAll(pageable)).thenReturn(page);
        when(registrationRepository.countGroupedByEventIdsAndStatus(any(), eq(RegistrationStatus.ACTIVE)))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 60L}));
        when(checkInHistoryRepository.countGroupedByEventIds(any()))
                .thenReturn(List.<Object[]>of(new Object[]{1L, 45L}));

        PageRes<EventRes> result = eventService.getAllEvents(pageable);

        assertEquals(75.0, result.getContent().get(0).getAttendanceRate());
        assertEquals(0.0, result.getContent().get(1).getAttendanceRate());
    }

    @Test
    void testGetById_TC2_Capacity50_20DangKyActive_AvailableSeats30() {
        Event existing = buildExistingEvent();
        existing.setCapacity(50);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(existing));
        // Query group by đã tự lọc status=ACTIVE ở tầng SQL nên 5 lượt CANCELLED không
        // được tính vào đây — chỉ 20 lượt ACTIVE được trả về
        when(registrationRepository.countByEventIdAndStatus(1L, RegistrationStatus.ACTIVE)).thenReturn(20L);
        when(checkInHistoryRepository.countByRegistration_EventId(1L)).thenReturn(15L);

        EventDetailRes result = eventService.getById(1L);

        assertEquals(20L, result.getTotalRegistered());
        assertEquals(30, result.getAvailableSeats());
    }

    @Test
    void testGetById_TC3_KhongTonTai_Nem404() {
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> eventService.getById(999L));
    }

    /**
     * Test case B4.3-T3: TC1 45/60 -> 75.0.
     */
    @Test
    void testGetById_B43TC1_45Tren60_TyLe75Phay0() {
        Event existing = buildExistingEvent();
        existing.setCapacity(60);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(registrationRepository.countByEventIdAndStatus(1L, RegistrationStatus.ACTIVE)).thenReturn(60L);
        when(checkInHistoryRepository.countByRegistration_EventId(1L)).thenReturn(45L);

        EventDetailRes result = eventService.getById(1L);

        assertEquals(75.0, result.getAttendanceRate());
    }

    /**
     * Test case B4.3-T3: TC2 chưa có đăng ký nào -> 0.0, không lỗi chia 0.
     */
    @Test
    void testGetById_B43TC2_ChuaCoDangKy_TyLe0Phay0KhongLoiChia0() {
        Event existing = buildExistingEvent();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(registrationRepository.countByEventIdAndStatus(1L, RegistrationStatus.ACTIVE)).thenReturn(0L);

        EventDetailRes result = eventService.getById(1L);

        assertEquals(0.0, result.getAttendanceRate());
        // totalRegistered = 0 thì không cần query present -> khỏi gọi checkInHistoryRepository
        verify(checkInHistoryRepository, never()).countByRegistration_EventId(any());
    }

    /**
     * Test case B4.3-T3: TC3 1/3 -> 33.3 (đúng quy tắc làm tròn 1 chữ số thập phân).
     */
    @Test
    void testGetById_B43TC3_MotTrenBa_LamTron33Phay3() {
        Event existing = buildExistingEvent();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(registrationRepository.countByEventIdAndStatus(1L, RegistrationStatus.ACTIVE)).thenReturn(3L);
        when(checkInHistoryRepository.countByRegistration_EventId(1L)).thenReturn(1L);

        EventDetailRes result = eventService.getById(1L);

        assertEquals(33.3, result.getAttendanceRate());
    }

    private void setCurrentUser(String username) {
        SecurityContext context = new SecurityContextImpl();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(username, null));
        SecurityContextHolder.setContext(context);
    }
}
