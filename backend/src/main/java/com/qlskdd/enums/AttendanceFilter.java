package com.qlskdd.enums;

import com.qlskdd.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;

// B4.4-T1/T2: 3 lựa chọn lọc cho GET /api/v1/events/{id}/attendance?status=.
public enum AttendanceFilter {
    ALL, PRESENT, ABSENT;

    // status rỗng/null -> mặc định ALL; giá trị khác all/present/absent -> 400
    public static AttendanceFilter fromParam(String status) {
        if (!StringUtils.hasText(status)) {
            return ALL;
        }
        try {
            return valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "Trạng thái lọc không hợp lệ, chỉ chấp nhận all/present/absent");
        }
    }
}
