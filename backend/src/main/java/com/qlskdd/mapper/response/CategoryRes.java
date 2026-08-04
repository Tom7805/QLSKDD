package com.qlskdd.mapper.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRes {
    private Long id;
    private String name;
    private String description;
    private Long eventCount;
}
