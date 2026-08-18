package com.qlskdd.security;

import com.qlskdd.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Kiểm tra quyền sở hữu lượt đăng ký, dùng trong SpEL của @PreAuthorize
 * (RegistrationController: @registrationSecurityService.isOwner(...)) — B3.2-T1.
 */
@Service("registrationSecurityService")
@RequiredArgsConstructor
public class RegistrationSecurityService {

    private final RegistrationRepository registrationRepository;

    /*
     * PHẢI có @Transactional: `Registration.user` khai FetchType.LAZY, mà hàm này gọi
     * getUser().getUsername(). Không có transaction thì findById() mở một session rồi đóng
     * ngay, entity trả về có `user` là proxy chưa khởi tạo -> LazyInitializationException.
     *
     * Hậu quả rất nặng vì đây là lớp kiểm tra quyền: MỌI thao tác của chính chủ trên vé của
     * mình đều trả 500 — xem mã QR và huỷ đăng ký. Người có vai ADMIN/ORGANIZER lại không
     * dính, vì SpEL `hasAnyRole(...) or isOwner(...)` ngắn mạch ở vế đầu nên isOwner không
     * bao giờ chạy. Đúng lý do lỗi lọt qua mọi lần thử nghiệm bằng tài khoản quản trị.
     *
     * Ở profile dev không lộ vì Spring Boot mặc định bật open-in-view=true giữ session mở
     * suốt request; profile prod tắt đi nên mới nổ.
     */
    @Transactional(readOnly = true)
    public boolean isOwner(String username, Long registrationId) {
        return registrationRepository.findById(registrationId)
                .map(registration -> username != null && username.equals(registration.getUser().getUsername()))
                .orElse(false);
    }
}
