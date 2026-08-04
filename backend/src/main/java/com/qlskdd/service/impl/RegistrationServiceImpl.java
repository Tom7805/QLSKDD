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
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void register(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Sự kiện", "id", eventId));

        // B2.4-T2: chặn đăng ký khi sự kiện không ở trạng thái OPEN — chặn ở tầng
        // service (không chỉ ẩn nút trên FE) để không bị lách qua bằng gọi API trực tiếp
        if (event.getStatus() != EventStatus.OPEN) {
            throw new BusinessException(HttpStatus.CONFLICT, "Sự kiện đã đóng đăng ký");
        }

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản", "username", currentUsername));

        Registration registration = Registration.builder()
                .event(event)
                .user(user)
                .status(RegistrationStatus.ACTIVE)
                .build();

        registrationRepository.save(registration);
    }
}
