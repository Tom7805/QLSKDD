package com.qlskdd.service;

import com.qlskdd.mapper.response.EventRegistrationsRes;
import com.qlskdd.mapper.response.RegistrationRes;
import org.springframework.data.domain.Pageable;

public interface RegistrationService {

    // B2.4-T2: đăng ký tham gia sự kiện — chặn khi sự kiện không ở trạng thái OPEN.
    // Đây là bản tối thiểu, chỉ có đúng ràng buộc mà B2.4 yêu cầu; các ràng buộc còn
    // lại của luồng đăng ký đầy đủ (chặn hết chỗ, chặn đăng ký trùng, sinh mã vé...)
    // thuộc phạm vi B3.1.
    RegistrationRes register(Long eventId);

    // B3.2-T1: huỷ đăng ký — đổi status sang CANCELLED, không xoá bản ghi.
    // Quyền sở hữu (chỉ chính chủ hoặc ADMIN) được chặn ở @PreAuthorize của controller.
    void cancel(Long registrationId);

    // B3.3-T1/T2: danh sách người đăng ký của 1 sự kiện, phân trang + summary.
    // Chỉ ADMIN/ORGANIZER gọi được — chặn ở @PreAuthorize của controller.
    EventRegistrationsRes getRegistrationsByEvent(Long eventId, Pageable pageable);
}
