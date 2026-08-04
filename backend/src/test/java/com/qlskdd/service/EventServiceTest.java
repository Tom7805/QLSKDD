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
import com.qlskdd.repository.CategoryRepository;
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

    private final EventMapper eventMapper = new EventMapper();

    private EventServiceImpl eventService;

    private EventCategory category;

    @BeforeEach
    void setUp() {
        eventService = new EventServiceImpl(eventRepository, categoryRepository, registrationRepository, eventMapper);
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

    private void setCurrentUser(String username) {
        SecurityContext context = new SecurityContextImpl();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(username, null));
        SecurityContextHolder.setContext(context);
    }
}
