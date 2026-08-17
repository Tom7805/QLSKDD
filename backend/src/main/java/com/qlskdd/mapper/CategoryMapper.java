package com.qlskdd.mapper;

import com.qlskdd.entity.EventCategory;
import com.qlskdd.mapper.response.CategoryRes;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    // eventCount tính riêng ở service (group by hoặc countByCategoryId), không nằm
    // sẵn trên entity nên phải truyền vào đây
    public CategoryRes toRes(EventCategory category, long eventCount) {
        return CategoryRes.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .eventCount(eventCount)
                .build();
    }
}
