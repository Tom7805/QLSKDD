package com.qlskdd.mapper.response;

import com.qlskdd.enums.CheckInStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

// B4.1-T4: chỉ dùng cho nhánh SUCCESS (200 OK) — các nhánh còn lại (ALREADY_CHECKED_IN,
// INVALID_TICKET, WRONG_EVENT, đã huỷ) được ném dưới dạng BusinessException và trả về
// theo format ErrorResponse chung của cả dự án (giống errorCode của B3.1), không dùng DTO này.
@Data
@Builder
public class CheckInRes {
    private CheckInStatus status;
    private String message;
    private String participantName;
    private LocalDateTime checkedInAt;
}
