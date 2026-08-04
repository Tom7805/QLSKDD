package com.qlskdd.service.impl;

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
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final RegistrationRepository registrationRepository;
    private final EventMapper eventMapper;

    @Override
    public EventDetailRes create(EventReq req) {
        EventCategory category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Loại sự kiện", "id", req.getCategoryId()));

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        Event event = new Event();
        event.setName(req.getName());
        event.setDescription(req.getDescription());
        event.setLocation(req.getLocation());
        event.setCapacity(req.getCapacity());
        event.setCategory(category);
        event.setStartAt(req.getStartAt());
        event.setEndAt(req.getEndAt());
        event.setStatus(EventStatus.OPEN);
        event.setCreatedBy(currentUsername);
        event.setCreatedAt(LocalDateTime.now());

        // Sự kiện vừa tạo chắc chắn chưa có ai đăng ký
        return eventMapper.toDetailRes(eventRepository.save(event), 0L);
    }

    @Override
    public EventDetailRes update(Long id, EventReq req) {
        Event event = findEventOrThrow(id);

        EventCategory category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Loại sự kiện", "id", req.getCategoryId()));

        // B2.3-T1: chặn giảm sức chứa xuống dưới số người đã đăng ký ACTIVE
        long activeRegistrations = registrationRepository.countByEventIdAndStatus(id, RegistrationStatus.ACTIVE);
        if (req.getCapacity() < activeRegistrations) {
            throw new BusinessException(HttpStatus.CONFLICT,
                    "Sức chứa không thể nhỏ hơn số người đã đăng ký (" + activeRegistrations + ")");
        }

        event.setName(req.getName());
        event.setDescription(req.getDescription());
        event.setLocation(req.getLocation());
        event.setCapacity(req.getCapacity());
        event.setCategory(category);
        event.setStartAt(req.getStartAt());
        event.setEndAt(req.getEndAt());

        // activeRegistrations đã tính ở trên (dùng để validate capacity) — dùng lại,
        // không query thêm lần nữa
        return eventMapper.toDetailRes(eventRepository.save(event), activeRegistrations);
    }

    @Override
    public EventDetailRes changeStatus(Long id, EventStatusReq req) {
        Event event = findEventOrThrow(id);
        EventStatus current = event.getStatus();
        EventStatus target = req.getStatus();

        // B2.4-T1: chỉ cho phép đúng 3 cặp chuyển trạng thái này
        boolean allowed =
                (current == EventStatus.OPEN && target == EventStatus.CLOSED)
                || (current == EventStatus.OPEN && target == EventStatus.CANCELLED)
                || (current == EventStatus.CLOSED && target == EventStatus.OPEN);

        if (!allowed) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Không thể chuyển trạng thái này");
        }

        event.setStatus(target);
        long totalRegistered = registrationRepository.countByEventIdAndStatus(id, RegistrationStatus.ACTIVE);
        return eventMapper.toDetailRes(eventRepository.save(event), totalRegistered);
    }

    private Event findEventOrThrow(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sự kiện", "id", id));
    }

    @Override
    public PageRes<EventRes> getAllEvents(Pageable pageable) {
        Page<Event> eventPage = eventRepository.findAll(pageable);

        // B2.5-T1: đếm số đăng ký ACTIVE cho CẢ TRANG bằng đúng 1 truy vấn group by,
        // không gọi countByEventIdAndStatus lặp lại cho từng sự kiện (tránh N+1)
        List<Long> eventIds = eventPage.getContent().stream().map(Event::getId).toList();
        Map<Long, Long> activeCountByEventId = new HashMap<>();
        if (!eventIds.isEmpty()) {
            for (Object[] row : registrationRepository
                    .countGroupedByEventIdsAndStatus(eventIds, RegistrationStatus.ACTIVE)) {
                activeCountByEventId.put((Long) row[0], (Long) row[1]);
            }
        }

        Page<EventRes> dtoPage = eventPage.map(event -> {
            EventRes res = new EventRes();
            res.setId(event.getId());
            res.setName(event.getName());
            res.setLocation(event.getLocation());
            res.setStartAt(event.getStartAt());
            res.setEndAt(event.getEndAt());
            res.setStatus(event.getStatus());
            res.setCapacity(event.getCapacity());

            Integer capacity = event.getCapacity();
            if (capacity != null) {
                long activeCount = activeCountByEventId.getOrDefault(event.getId(), 0L);
                res.setAvailableSeats((int) (capacity - activeCount));
            }
            return res;
        });

        return PageRes.of(dtoPage);
    }

    @Override
    public EventDetailRes getById(Long id) {
        Event event = findEventOrThrow(id);
        long totalRegistered = registrationRepository.countByEventIdAndStatus(id, RegistrationStatus.ACTIVE);
        return eventMapper.toDetailRes(event, totalRegistered);
    }
}