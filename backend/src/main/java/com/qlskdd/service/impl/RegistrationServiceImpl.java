package com.qlskdd.service.impl;

import com.qlskdd.entity.Event;
import com.qlskdd.entity.Registration;
import com.qlskdd.entity.User;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.repository.CheckInHistoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import com.qlskdd.exception.DuplicateDataException;
import com.qlskdd.exception.OverbookingException;
import com.qlskdd.mapper.RegistrationMapper;
import com.qlskdd.mapper.response.AttendanceItemRes;
import com.qlskdd.mapper.response.AttendanceSummary;
import com.qlskdd.mapper.response.AttendanceSummaryRes;
import com.qlskdd.mapper.response.EventRegistrationsRes;
import com.qlskdd.mapper.response.MyRegistrationRes;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.mapper.response.RegistrationListItemRes;
import com.qlskdd.mapper.response.RegistrationRes;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final CheckInHistoryRepository checkInHistoryRepository;
    private final RegistrationMapper registrationMapper;

    @Override
    @Transactional
    public RegistrationRes register(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Sự kiện", "id", eventId));

        if (event.getStatus() != EventStatus.OPEN) {
            throw new BusinessException(HttpStatus.CONFLICT, "Sự kiện đã đóng đăng ký", "EVENT_CLOSED");
        }

        if (event.getEndAt() != null && event.getEndAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Sự kiện đã diễn ra", "EVENT_ENDED");
        }

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản", "username", currentUsername));

        boolean isDuplicate = registrationRepository.existsByEventIdAndUserIdAndStatus(
                eventId, user.getId(), RegistrationStatus.ACTIVE);
        if (isDuplicate) {
            throw new DuplicateDataException("Bạn đã đăng ký sự kiện này", "DUPLICATE_REGISTRATION");
        }

        if (event.getCapacity() != null) {
            long countActive = registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.ACTIVE);
            if (countActive >= event.getCapacity()) {
                throw new OverbookingException("Sự kiện đã hết chỗ");
            }
        }

        String code = UUID.randomUUID().toString();

        Registration registration = Registration.builder()
                .event(event)
                .user(user)
                .status(RegistrationStatus.ACTIVE)
                .code(code)
                .build();

        registration = registrationRepository.save(registration);

        return RegistrationRes.builder()
                .registrationId(registration.getId())
                .code(registration.getCode())
                .eventName(event.getName())
                .build();
    }

    @Override
    @Transactional
    public void cancel(Long registrationId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Lượt đăng ký", "id", registrationId));

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Lượt đăng ký này đã được huỷ trước đó");
        }

        Event event = registration.getEvent();
        if (event.getStartAt() != null && event.getStartAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Sự kiện đã bắt đầu, không thể huỷ đăng ký");
        }

        // B4.1: chặn huỷ khi lượt đăng ký đã có bản ghi điểm danh
        if (checkInHistoryRepository.existsByRegistrationId(registrationId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Lượt đăng ký đã được điểm danh, không thể huỷ");
        }

        registration.setStatus(RegistrationStatus.CANCELLED);
        registrationRepository.save(registration);
        // Không xoá bản ghi (giữ lịch sử) — mọi truy vấn đếm chỗ đều lọc status=ACTIVE
        // (countByEventIdAndStatus, countGroupedByEventIdsAndStatus) nên availableSeats
        // tự tăng lại ngay khi đọc lại, không cần thao tác gì thêm (B3.2-T2).
    }

    @Override
    public PageRes<MyRegistrationRes> getMyRegistrations(Pageable pageable) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        Page<Registration> registrations = registrationRepository
                .findByUserUsernameOrderByRegisteredAtDesc(currentUsername, pageable);

        return PageRes.of(registrations.map(registrationMapper::toMyRegistrationRes));
    }

    @Override
    public EventRegistrationsRes getRegistrationsByEvent(Long eventId, Pageable pageable) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Sự kiện", "id", eventId));

        // B3.3-T1: findByEventId đã có sẵn @EntityGraph(user) từ B3.1-T2 -> không N+1
        Page<Registration> registrationPage = registrationRepository.findByEventId(eventId, pageable);

        // B4.1: xác định registrationId nào đã điểm danh cho CẢ TRANG bằng 1 truy vấn,
        // không gọi existsByRegistrationId lặp lại cho từng dòng (tránh N+1)
        List<Long> registrationIds = registrationPage.getContent().stream().map(Registration::getId).toList();
        Set<Long> checkedInIds = registrationIds.isEmpty()
                ? new HashSet<>()
                : new HashSet<>(checkInHistoryRepository.findCheckedInRegistrationIds(registrationIds));

        Page<RegistrationListItemRes> itemPage = registrationPage.map(r -> RegistrationListItemRes.builder()
                .id(r.getId())
                .fullName(r.getUser().getFullName())
                .email(r.getUser().getEmail())
                .phone(r.getUser().getPhone())
                .registeredAt(r.getRegisteredAt())
                .status(r.getStatus())
                .checkedIn(checkedInIds.contains(r.getId()))
                .build());

        long totalRegistered = registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.ACTIVE);

        return EventRegistrationsRes.builder()
                .registrations(PageRes.of(itemPage))
                .summary(EventRegistrationsRes.Summary.builder()
                        .totalRegistered(totalRegistered)
                        .capacity(event.getCapacity())
                        .build())
                .build();
    }

    @Override
    public AttendanceSummaryRes getAttendanceSummary(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Sự kiện", "id", eventId);
        }

        // B4.2-T1: 1 truy vấn lấy toàn bộ ĐK ACTIVE của sự kiện (kèm sẵn user, chống N+1)
        List<Registration> activeRegistrations = registrationRepository.findByEventIdAndStatus(eventId,
                RegistrationStatus.ACTIVE);

        // B4.2-T1: 1 truy vấn khác lấy registrationId + checkedInAt cho CẢ NHÓM trên, rồi
        // đối chiếu trong bộ nhớ để tách 2 nhóm — tổng cộng đúng 2 truy vấn, không N+1.
        List<Long> registrationIds = activeRegistrations.stream().map(Registration::getId).toList();
        Map<Long, LocalDateTime> checkedInAtByRegistrationId = new HashMap<>();
        if (!registrationIds.isEmpty()) {
            for (Object[] row : checkInHistoryRepository.findCheckedInAtByRegistrationIds(registrationIds)) {
                checkedInAtByRegistrationId.put((Long) row[0], (LocalDateTime) row[1]);
            }
        }

        List<AttendanceItemRes> present = new ArrayList<>();
        List<AttendanceItemRes> absent = new ArrayList<>();
        for (Registration registration : activeRegistrations) {
            LocalDateTime checkedInAt = checkedInAtByRegistrationId.get(registration.getId());
            AttendanceItemRes item = AttendanceItemRes.builder()
                    .registrationId(registration.getId())
                    .fullName(registration.getUser().getFullName())
                    .email(registration.getUser().getEmail())
                    .phone(registration.getUser().getPhone())
                    .registeredAt(registration.getRegisteredAt())
                    .checkedInAt(checkedInAt)
                    .build();
            (checkedInAt != null ? present : absent).add(item);
        }

        // B4.2-T2: 3 số liệu tính đúng 1 lần ở đây — total/present/absent đối chiếu chéo
        // được (present.size() + absent.size() == totalRegistered luôn đúng vì cùng nguồn).
        long totalRegistered = activeRegistrations.size();
        long presentCount = present.size();
        long absentCount = absent.size();
        // B4.3-T1: dùng chung công thức AttendanceRateUtil với chi tiết sự kiện (B4.3-T2)
        double attendanceRate = com.qlskdd.util.AttendanceRateUtil.calculate(presentCount, totalRegistered);

        return AttendanceSummaryRes.builder()
                .summary(new AttendanceSummary(totalRegistered, presentCount, absentCount, attendanceRate))
                .present(present)
                .absent(absent)
                .build();
    }
}
