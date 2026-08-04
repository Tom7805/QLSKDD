package com.qlskdd.dto.request;

import com.qlskdd.enums.EventStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

// B2.4-T1: body của PATCH /api/v1/events/{id}/status
@Data
public class EventStatusReq {

    @NotNull(message = "Trạng thái không được để trống")
    private EventStatus status;
}
