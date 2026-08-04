package com.qlskdd.mapper.response;

import com.qlskdd.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDetailRes {
    private Long id;
    private String name;
    private String description;
    private String location;
    private Integer capacity;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private EventStatus status;
    private Long categoryId;
    private String categoryName;
    private String createdBy;
    private LocalDateTime createdAt;
}
