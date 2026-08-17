package com.qlskdd.security;

import com.qlskdd.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Kiểm tra quyền sở hữu lượt đăng ký, dùng trong SpEL của @PreAuthorize
 * (RegistrationController: @registrationSecurityService.isOwner(...)) — B3.2-T1.
 */
@Service("registrationSecurityService")
@RequiredArgsConstructor
public class RegistrationSecurityService {

    private final RegistrationRepository registrationRepository;

    public boolean isOwner(String username, Long registrationId) {
        return registrationRepository.findById(registrationId)
                .map(registration -> username != null && username.equals(registration.getUser().getUsername()))
                .orElse(false);
    }
}
