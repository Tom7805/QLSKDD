package com.qlskdd.service;

import com.qlskdd.mapper.response.CheckInRes;

public interface CheckInService {

    // B4.1-T3: điểm danh 1 lượt đăng ký. Ném BusinessException với errorCode tương ứng
    // cho các nhánh bị từ chối (INVALID_TICKET 404, WRONG_EVENT 400, ALREADY_CHECKED_IN
    // 409, lượt đăng ký đã huỷ 409) — chỉ nhánh hợp lệ mới trả về CheckInRes.
    CheckInRes checkIn(Long registrationId, Long eventId);
}
