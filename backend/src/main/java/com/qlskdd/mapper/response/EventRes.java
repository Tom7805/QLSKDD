package com.qlskdd.mapper.response;

import com.qlskdd.enums.EventStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EventRes {
    private Long id;
    private String name;
    private String location;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private EventStatus status;
}