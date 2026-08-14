package com.qlskdd.service.impl;

import com.qlskdd.entity.CheckInHistory;
import com.qlskdd.entity.Registration;
import com.qlskdd.entity.User;
import com.qlskdd.enums.CheckInStatus;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.mapper.response.CheckInRes;
import com.qlskdd.repository.CheckInHistoryRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.service.CheckInService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class CheckInServiceImpl implements CheckInService {

    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private final RegistrationRepository registrationRepository;
    private final CheckInHistoryRepository checkInHistoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CheckInRes checkIn(Long registrationId, Long eventId) {
        // Bước 1: không tìm thấy lượt đăng ký -> INVALID_TICKET 404
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,
                        "Vé không hợp lệ", CheckInStatus.INVALID_TICKET.name()));

        return checkInRegistration(registration, eventId);
    }

    @Override
    @Transactional
    public CheckInRes checkInByCode(String code, Long eventId) {
        // B4.5-T3: Bước 1 — không tìm thấy lượt đăng ký ứng với mã -> INVALID_TICKET 404,
        // giống hệt nhánh 1 của checkIn(registrationId), chỉ khác cách tra cứu
        Registration registration = registrationRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,
                        "Vé không hợp lệ", CheckInStatus.INVALID_TICKET.name()));

        return checkInRegistration(registration, eventId);
    }

    // B4.5-T3: gộp 4 bước còn lại (wrong event / đã huỷ / đã điểm danh / tạo bản ghi
    // SUCCESS) để checkIn() và checkInByCode() dùng chung đúng 1 logic, không lặp code.
    private CheckInRes checkInRegistration(Registration registration, Long eventId) {
        // Bước 2: lượt đăng ký thuộc sự kiện khác -> WRONG_EVENT 400
        if (!registration.getEvent().getId().equals(eventId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "Lượt đăng ký không thuộc sự kiện này", CheckInStatus.WRONG_EVENT.name());
        }

        // Bước 3: lượt đăng ký đã bị huỷ -> từ chối
        if (registration.getStatus() != RegistrationStatus.ACTIVE) {
            throw new BusinessException(HttpStatus.CONFLICT, "Lượt đăng ký đã bị huỷ");
        }

        // Bước 4: đã điểm danh trước đó -> ALREADY_CHECKED_IN 409, không sinh thêm bản ghi
        checkInHistoryRepository.findByRegistrationId(registration.getId()).ifPresent(existing -> {
            throw new BusinessException(HttpStatus.CONFLICT,
                    "Người này đã điểm danh lúc " + existing.getCheckedInAt().format(HHMM),
                    CheckInStatus.ALREADY_CHECKED_IN.name());
        });

        // Bước 5: hợp lệ -> tạo bản ghi SUCCESS
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User checkedBy = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản", "username", currentUsername));

        CheckInHistory history = CheckInHistory.builder()
                .registration(registration)
                .checkedBy(checkedBy)
                .status(CheckInStatus.SUCCESS)
                .build();
        history = checkInHistoryRepository.save(history);

        return CheckInRes.builder()
                .status(CheckInStatus.SUCCESS)
                .message("Điểm danh thành công")
                .registrationId(registration.getId())
                .participantName(registration.getUser().getFullName())
                .checkedInAt(history.getCheckedInAt())
                .build();
    }
}
