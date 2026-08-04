package com.qlskdd.service;

public interface RegistrationService {

    // B2.4-T2: đăng ký tham gia sự kiện — chặn khi sự kiện không ở trạng thái OPEN.
    // Đây là bản tối thiểu, chỉ có đúng ràng buộc mà B2.4 yêu cầu; các ràng buộc còn
    // lại của luồng đăng ký đầy đủ (chặn hết chỗ, chặn đăng ký trùng, sinh mã vé...)
    // thuộc phạm vi B3.1.
    void register(Long eventId);
}
