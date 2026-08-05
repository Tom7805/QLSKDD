package com.qlskdd.service.impl;

import com.qlskdd.entity.Event;
import com.qlskdd.entity.Registration;
import com.qlskdd.entity.User;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import com.qlskdd.exception.DuplicateDataException;
import com.qlskdd.exception.OverbookingException;
import com.qlskdd.mapper.response.RegistrationRes;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;

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

        // TODO(B4.1): chặn huỷ khi lượt đăng ký đã có bản ghi điểm danh — cần
        // CheckInHistoryRepository.existsByRegistrationId(registrationId), hiện B4.1
        // (check-in) chưa được triển khai nên tạm thời bỏ qua điều kiện này.

        registration.setStatus(RegistrationStatus.CANCELLED);
        registrationRepository.save(registration);
        // Không xoá bản ghi (giữ lịch sử) — mọi truy vấn đếm chỗ đều lọc status=ACTIVE
        // (countByEventIdAndStatus, countGroupedByEventIdsAndStatus) nên availableSeats
        // tự tăng lại ngay khi đọc lại, không cần thao tác gì thêm (B3.2-T2).
    }
}
