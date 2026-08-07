package com.qlskdd.mapper;

import com.qlskdd.entity.Event;
import com.qlskdd.entity.Registration;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.mapper.response.MyRegistrationRes;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class RegistrationMapper {

    // B3.2-T5: dòng dữ liệu cho trang "Sự kiện của tôi"
    public MyRegistrationRes toMyRegistrationRes(Registration registration) {
        Event event = registration.getEvent();
        boolean eventStarted = event.getStartAt() != null && event.getStartAt().isBefore(LocalDateTime.now());
        boolean canCancel = registration.getStatus() == RegistrationStatus.ACTIVE && !eventStarted;

        return MyRegistrationRes.builder()
                .registrationId(registration.getId())
                .code(registration.getCode())
                .registrationStatus(registration.getStatus())
                .registeredAt(registration.getRegisteredAt())
                .eventId(event.getId())
                .eventName(event.getName())
                .location(event.getLocation())
                .startAt(event.getStartAt())
                .endAt(event.getEndAt())
                .eventStatus(event.getStatus())
                .canCancel(canCancel)
                .build();
    }
}
