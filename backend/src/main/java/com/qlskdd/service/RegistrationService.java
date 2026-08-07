package com.qlskdd.service;

import com.qlskdd.mapper.response.MyRegistrationRes;
import com.qlskdd.mapper.response.PageRes;
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

    // B3.2-T5: danh sách lượt đăng ký của người đang đăng nhập, phục vụ trang
    // "Sự kiện của tôi" bên FE.
    PageRes<MyRegistrationRes> getMyRegistrations(Pageable pageable);
}
