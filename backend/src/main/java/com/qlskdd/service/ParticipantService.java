package com.qlskdd.service;

import com.qlskdd.dto.request.ParticipantReq;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.mapper.response.ParticipantRes;
import org.springframework.data.domain.Pageable;

public interface ParticipantService {

    // B3.4-T1: danh sách người tham gia (user có vai trò ROLE_USER), kèm số sự kiện
    // đã đăng ký tính bằng 1 truy vấn group by cho cả trang (không N+1)
    PageRes<ParticipantRes> getParticipants(String keyword, Pageable pageable);

    ParticipantRes getById(Long id);

    ParticipantRes create(ParticipantReq req);

    ParticipantRes update(Long id, ParticipantReq req);

    // B3.4-T2: chặn xoá khi còn lượt đăng ký ACTIVE
    void delete(Long id);
}
