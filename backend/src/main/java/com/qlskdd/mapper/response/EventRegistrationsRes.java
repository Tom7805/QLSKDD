package com.qlskdd.mapper.response;

import lombok.Builder;
import lombok.Data;

// B3.3-T2: response của GET /events/{eventId}/registrations — danh sách phân trang
// kèm summary (tổng đăng ký ACTIVE / sức chứa) để FE vẽ thanh tiến độ.
@Data
@Builder
public class EventRegistrationsRes {
    private PageRes<RegistrationListItemRes> registrations;
    private Summary summary;

    @Data
    @Builder
    public static class Summary {
        private long totalRegistered;
        private Integer capacity;
    }
}
