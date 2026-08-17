package com.qlskdd.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegistrationReq {
    @NotNull(message = "Sự kiện không được để trống")
    private Long eventId;
}
