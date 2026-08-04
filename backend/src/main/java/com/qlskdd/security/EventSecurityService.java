package com.qlskdd.security;

import com.qlskdd.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Kiểm tra quyền sở hữu sự kiện, dùng trong SpEL của @PreAuthorize
 * (EventController: @eventSecurityService.canManageEvent(...)) — B1.3-T3.
 */
@Service("eventSecurityService")
@RequiredArgsConstructor
public class EventSecurityService {

    private final EventRepository eventRepository;

    public boolean canManageEvent(String username, Long eventId) {
        return eventRepository.findById(eventId)
                .map(event -> username != null && username.equals(event.getCreatedBy()))
                .orElse(false);
    }
}
