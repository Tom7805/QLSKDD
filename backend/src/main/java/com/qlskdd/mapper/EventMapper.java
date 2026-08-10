package com.qlskdd.mapper;

import com.qlskdd.entity.Event;
import com.qlskdd.mapper.response.EventDetailRes;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {

    // B2.5-T2/B4.3-T2: totalRegistered và attendanceRate truyền vào từ service (đếm/tính
    // bằng RegistrationRepository + CheckInHistoryRepository) vì mapper không nên tự query DB
    public EventDetailRes toDetailRes(Event event, long totalRegistered, double attendanceRate) {
        Integer capacity = event.getCapacity();
        Integer availableSeats = capacity != null ? (int) (capacity - totalRegistered) : null;

        return EventDetailRes.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .location(event.getLocation())
                .capacity(capacity)
                .startAt(event.getStartAt())
                .endAt(event.getEndAt())
                .status(event.getStatus())
                .categoryId(event.getCategory() != null ? event.getCategory().getId() : null)
                .categoryName(event.getCategory() != null ? event.getCategory().getName() : null)
                .createdBy(event.getCreatedBy())
                .createdAt(event.getCreatedAt())
                .totalRegistered(totalRegistered)
                .availableSeats(availableSeats)
                .attendanceRate(attendanceRate)
                .build();
    }
}
