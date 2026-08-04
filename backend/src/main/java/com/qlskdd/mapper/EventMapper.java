package com.qlskdd.mapper;

import com.qlskdd.entity.Event;
import com.qlskdd.mapper.response.EventDetailRes;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {

    public EventDetailRes toDetailRes(Event event) {
        return EventDetailRes.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .location(event.getLocation())
                .capacity(event.getCapacity())
                .startAt(event.getStartAt())
                .endAt(event.getEndAt())
                .status(event.getStatus())
                .categoryId(event.getCategory() != null ? event.getCategory().getId() : null)
                .categoryName(event.getCategory() != null ? event.getCategory().getName() : null)
                .createdBy(event.getCreatedBy())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
