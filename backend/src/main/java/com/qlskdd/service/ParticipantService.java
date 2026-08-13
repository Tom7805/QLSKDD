package com.qlskdd.service;

import com.qlskdd.dto.request.ParticipantReq;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.mapper.response.ParticipantRes;
import org.springframework.data.domain.Pageable;

public interface ParticipantService {

    // B3.4-T1: danh sách người tham gia (user có vai trò ROLE_USER), kèm số sự kiện
    // đã đăng ký tính bằng 1 truy vấn group by cho cả trang (không N+1)
    //
    // B5.3-T2: bổ sung lọc thêm eventId (chỉ người có đăng ký trong sự kiện) và status
    // (trạng thái đăng ký khi lọc theo sự kiện). eventId = null -> bỏ qua lọc theo sự kiện
    // (status lúc đó bỏ qua). status = null kèm eventId -> lấy mọi trạng thái đăng ký.
    PageRes<ParticipantRes> getParticipants(String keyword, Long eventId,
                                            RegistrationStatus status, Pageable pageable);

    ParticipantRes getById(Long id);

    ParticipantRes create(ParticipantReq req);

    ParticipantRes update(Long id, ParticipantReq req);

    // B3.4-T2: chặn xoá khi còn lượt đăng ký ACTIVE
    void delete(Long id);
}
