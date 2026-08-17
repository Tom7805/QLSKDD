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
import org.springframework.transaction.annotation.Transactional;

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
    private final com.qlskdd.repository.UserRepository userRepository;
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

    // B5.2-T1/T2: điểm vào duy nhất của GET /events — thay thế getAllEvents (B2.5) và
    // bản keyword-only (B5.1), vì EventSpecification.filter đã là tập hợp lớn hơn (bao
    // trọn tìm theo keyword khi categoryId/status/from/to đều null). keyword rỗng/null,
    // categoryId null, status rỗng/null, from/to rỗng/null -> bỏ qua điều kiện tương ứng,
    // không lỗi (giữ đúng hành vi cũ của B2.5/B5.1: không truyền gì -> trả toàn bộ).
    @Override
    public PageRes<EventRes> searchEvents(String keyword, Long categoryId, String status,
                                           String from, String to, Pageable pageable) {
        LocalDate fromDate = parseDateOrThrow(from, "from");
        LocalDate toDate = parseDateOrThrow(to, "to");

        // B5.2-T2: from > to -> 400
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Tham số from phải nhỏ hơn hoặc bằng to");
        }

        // status không hợp lệ -> 400 ngay ở service (không lặng lẽ bỏ qua điều kiện lọc),
        // cùng cách AttendanceFilter.fromParam đang làm cho B4.4
        String normalizedStatus = normalizeStatusOrThrow(status);

        var spec = EventSpecification.filter(keyword, categoryId, normalizedStatus, fromDate, toDate);
        Page<Event> eventPage = eventRepository.findAll(spec, pageable);
        return toPageRes(eventPage);
    }

    private LocalDate parseDateOrThrow(String raw, String paramName) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(raw.trim());
        } catch (java.time.format.DateTimeParseException ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "Định dạng " + paramName + " phải là yyyy-MM-dd");
        }
    }

    private String normalizeStatusOrThrow(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return EventStatus.valueOf(status.trim().toUpperCase()).name();
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ");
        }
    }

    // B2.5-T1/B4.3-T4: đếm số đăng ký ACTIVE và số đã điểm danh cho CẢ TRANG bằng đúng
    // 1 truy vấn group by mỗi loại (tránh N+1), dùng chung cho mọi cách liệt kê sự kiện
    // có phân trang (danh sách thường lẫn có lọc).
    private PageRes<EventRes> toPageRes(Page<Event> eventPage) {
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
            // Category là LAZY nhưng findAll ở đây đi kèm @EntityGraph("category") nên đọc
            // ở đây không sinh thêm truy vấn cho từng sự kiện (N+1)
            res.setCategoryId(event.getCategory() != null ? event.getCategory().getId() : null);
            res.setCategoryName(event.getCategory() != null ? event.getCategory().getName() : null);

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

    /*
     * PHẢI có @Transactional: `Event.category` khai FetchType.LAZY, mà EventMapper.toDetailRes
     * gọi `getCategory().getName()`. Không có transaction thì session Hibernate đã đóng trước
     * lúc map, và lời gọi đó ném LazyInitializationException -> toàn bộ trang chi tiết sự kiện
     * trả 500.
     *
     * Vì sao trước đây không ai thấy: Spring Boot mặc định bật `open-in-view=true`, giữ session
     * mở suốt request nên nạp lười vẫn chạy. Profile prod tắt nó đi (đúng thực hành, vì OSIV
     * giấu lỗi và giữ kết nối database lâu hơn cần thiết) nên lỗi mới lộ.
     *
     * Thêm nữa, dữ liệu của DataSeeder (profile dev) KHÔNG gắn loại sự kiện — `getCategory()`
     * trả null nên mapper không chạm vào proxy. Chỉ tới khi dùng dữ liệu DemoSeeder (có gắn
     * loại) trên bản deploy thì mới nổ. Hai lớp che khuất cộng lại làm lỗi sống sót rất lâu.
     *
     * readOnly = true: chỉ đọc, báo cho Hibernate bỏ qua dirty checking.
     */
    @Override
    @Transactional(readOnly = true)
    public EventDetailRes getById(Long id) {
        Event event = findEventOrThrow(id);
        long totalRegistered = registrationRepository.countByEventIdAndStatus(id, RegistrationStatus.ACTIVE);
        long present = totalRegistered == 0 ? 0L : checkInHistoryRepository.countByRegistration_EventId(event.getId());
        double attendanceRate = AttendanceRateUtil.calculate(present, totalRegistered);
        return eventMapper.toDetailRes(event, totalRegistered, attendanceRate, isRegisteredByCurrentUser(id));
    }

    // B3.1: "đã đăng ký chưa" chỉ có ý nghĩa với người dùng đã đăng nhập — khách vãng lai
    // (anonymousUser, do GET /events/{id} permitAll) luôn coi là chưa đăng ký
    private boolean isRegisteredByCurrentUser(Long eventId) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return false;
        }
        return userRepository.findByUsername(authentication.getName())
                .map(user -> registrationRepository.existsByEventIdAndUserIdAndStatus(
                        eventId, user.getId(), RegistrationStatus.ACTIVE))
                .orElse(false);
    }
}