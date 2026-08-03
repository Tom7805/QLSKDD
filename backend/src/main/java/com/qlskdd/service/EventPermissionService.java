package com.qlskdd.service;

public interface EventPermissionService {
    boolean canManageEvent(String username, Long eventId);
}
