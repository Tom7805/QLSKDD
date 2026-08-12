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
import com.qlskdd.repository.CheckInHistoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.service.EventService;
import com.qlskdd.util.AttendanceRateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import com.qlskdd.specification.EventSpecification;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final CheckInHistoryRepository checkInHistoryRepository;
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
        return buildDetailRes(eventRepository.save(event), 0L);
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
        return buildDetailRes(eventRepository.save(event), activeRegistrations);
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
        return buildDetailRes(eventRepository.save(event), totalRegistered);
    }

    private Event findEventOrThrow(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sự kiện", "id", id));
    }

    // B4.3-T2: gói lại việc tính attendanceRate (dùng chung AttendanceRateUtil của B4.3-T1)
    // trước khi map sang DTO, để 4 nơi gọi mapper (create/update/changeStatus/getById) không
    // phải lặp lại đoạn tính "present + gọi AttendanceRateUtil" giống nhau.
    private EventDetailRes buildDetailRes(Event event, long totalRegistered) {
        // totalRegistered = 0 thì present chắc chắn cũng = 0 — khỏi cần query thêm
        // (đúng luôn cho trường hợp create() vừa tạo sự kiện mới)
        long present = totalRegistered == 0
                ? 0L
                : checkInHistoryRepository.countByRegistration_EventId(event.getId());
        double attendanceRate = AttendanceRateUtil.calculate(present, totalRegistered);
        return eventMapper.toDetailRes(event, totalRegistered, attendanceRate);
    }

    @Override
    public PageRes<EventRes> getAllEvents(Pageable pageable) {
        Page<Event> eventPage = eventRepository.findAll(pageable);

        // B2.5-T1: đếm số đăng ký ACTIVE cho CẢ TRANG bằng đúng 1 truy vấn group by,
        // không gọi countByEventIdAndStatus lặp lại cho từng sự kiện (tránh N+1)
        List<Long> eventIds = eventPage.getContent().stream().map(Event::getId).toList();
        Map<Long, Long> activeCountByEventId = new HashMap<>();
        // B4.3-T4: tương tự, đếm số đã điểm danh (present) cho cả trang bằng 1 truy vấn
        // group by để tính attendanceRate — không query riêng cho từng sự kiện.
        Map<Long, Long> presentCountByEventId = new HashMap<>();
        if (!eventIds.isEmpty()) {
            for (Object[] row : registrationRepository
                    .countGroupedByEventIdsAndStatus(eventIds, RegistrationStatus.ACTIVE)) {
                activeCountByEventId.put((Long) row[0], (Long) row[1]);
            }
            for (Object[] row : checkInHistoryRepository.countGroupedByEventIds(eventIds)) {
                presentCountByEventId.put((Long) row[0], (Long) row[1]);
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
            long activeCount = activeCountByEventId.getOrDefault(event.getId(), 0L);
            if (capacity != null) {
                res.setAvailableSeats((int) (capacity - activeCount));
            }

            long presentCount = presentCountByEventId.getOrDefault(event.getId(), 0L);
            res.setAttendanceRate(AttendanceRateUtil.calculate(presentCount, activeCount));
            return res;
        });

        return PageRes.of(dtoPage);
    }

    @Override
    public PageRes<EventRes> searchEvents(String keyword, Long categoryId, String status, LocalDate from, LocalDate to, Pageable pageable) {
        // build specification
        var spec = EventSpecification.filter(keyword, categoryId, status, from, to);

        Page<Event> eventPage = eventRepository.findAll(spec, pageable);

        List<Long> eventIds = eventPage.getContent().stream().map(Event::getId).toList();
        Map<Long, Long> activeCountByEventId = new HashMap<>();
        Map<Long, Long> presentCountByEventId = new HashMap<>();
        if (!eventIds.isEmpty()) {
            for (Object[] row : registrationRepository
                    .countGroupedByEventIdsAndStatus(eventIds, RegistrationStatus.ACTIVE)) {
                activeCountByEventId.put((Long) row[0], (Long) row[1]);
            }
            for (Object[] row : checkInHistoryRepository.countGroupedByEventIds(eventIds)) {
                presentCountByEventId.put((Long) row[0], (Long) row[1]);
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
            long activeCount = activeCountByEventId.getOrDefault(event.getId(), 0L);
            if (capacity != null) {
                res.setAvailableSeats((int) (capacity - activeCount));
            }

            long presentCount = presentCountByEventId.getOrDefault(event.getId(), 0L);
            res.setAttendanceRate(AttendanceRateUtil.calculate(presentCount, activeCount));
            return res;
        });

        return PageRes.of(dtoPage);
    }

    @Override
    public EventDetailRes getById(Long id) {
        Event event = findEventOrThrow(id);
        long totalRegistered = registrationRepository.countByEventIdAndStatus(id, RegistrationStatus.ACTIVE);
        return buildDetailRes(event, totalRegistered);
    }
}