package com.qlskdd.service;

import com.qlskdd.dto.request.EventReq;
import com.qlskdd.entity.Event;
import com.qlskdd.entity.EventCategory;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.mapper.EventMapper;
import com.qlskdd.mapper.response.EventDetailRes;
import com.qlskdd.repository.CategoryRepository;
import com.qlskdd.repository.EventRepository;
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
 * Test case B2.2-T6: tạo sự kiện.
 * EventMapper không mock (dùng bản thật) vì chỉ là logic ánh xạ đơn giản.
 */
@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private CategoryRepository categoryRepository;

    private final EventMapper eventMapper = new EventMapper();

    private EventServiceImpl eventService;

    private EventCategory category;

    @BeforeEach
    void setUp() {
        eventService = new EventServiceImpl(eventRepository, categoryRepository, eventMapper);
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

    private void setCurrentUser(String username) {
        SecurityContext context = new SecurityContextImpl();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(username, null));
        SecurityContextHolder.setContext(context);
    }
}
