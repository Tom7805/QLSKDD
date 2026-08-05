package com.qlskdd.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckInReq {

    @NotNull(message = "Lượt đăng ký không được để trống")
    private Long registrationId;

    @NotNull(message = "Sự kiện không được để trống")
    private Long eventId;
}
