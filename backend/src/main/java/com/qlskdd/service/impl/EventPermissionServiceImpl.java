package com.qlskdd.service.impl;

import com.qlskdd.entity.Event;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.service.EventPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class EventPermissionServiceImpl implements EventPermissionService {

    private final EventRepository eventRepository;

    @Override
    public boolean canManageEvent(String username, Long eventId) {
        if (eventId == null) {
            return false;
        }

        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null) {
            return false;
        }

        return Objects.equals(event.getCreatedBy(), username);
    }
}
