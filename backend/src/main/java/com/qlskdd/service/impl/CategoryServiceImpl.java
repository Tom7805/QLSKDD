package com.qlskdd.service.impl;

import com.qlskdd.dto.request.CategoryReq;
import com.qlskdd.entity.EventCategory;
import com.qlskdd.exception.DuplicateDataException;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.mapper.CategoryMapper;
import com.qlskdd.mapper.response.CategoryRes;
import com.qlskdd.repository.CategoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final EventRepository eventRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public List<CategoryRes> getAll() {
        List<EventCategory> categories = categoryRepository.findAll();

        // B2.1-T4: đếm eventCount cho cả danh sách bằng đúng 1 truy vấn group by,
        // không gọi countByCategoryId lặp lại cho từng loại (tránh N+1)
        Map<Long, Long> eventCountByCategoryId = new HashMap<>();
        for (Object[] row : eventRepository.countEventsGroupedByCategory()) {
            eventCountByCategoryId.put((Long) row[0], (Long) row[1]);
        }

        return categories.stream()
                .map(category -> categoryMapper.toRes(category,
                        eventCountByCategoryId.getOrDefault(category.getId(), 0L)))
                .toList();
    }

    @Override
    public CategoryRes getById(Long id) {
        EventCategory category = findCategoryOrThrow(id);
        long eventCount = eventRepository.countByCategoryId(id);
        return categoryMapper.toRes(category, eventCount);
    }

    @Override
    public CategoryRes create(CategoryReq req) {
        if (categoryRepository.existsByNameIgnoreCase(req.getName())) {
            throw new DuplicateDataException("Tên loại sự kiện đã tồn tại");
        }

        EventCategory category = EventCategory.builder()
                .name(req.getName())
                .description(req.getDescription())
                .build();

        return categoryMapper.toRes(categoryRepository.save(category), 0L);
    }

    @Override
    public CategoryRes update(Long id, CategoryReq req) {
        EventCategory category = findCategoryOrThrow(id);

        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(req.getName(), id)) {
            throw new DuplicateDataException("Tên loại sự kiện đã tồn tại");
        }

        category.setName(req.getName());
        category.setDescription(req.getDescription());
        categoryRepository.save(category);

        long eventCount = eventRepository.countByCategoryId(id);
        return categoryMapper.toRes(category, eventCount);
    }

    @Override
    public void delete(Long id) {
        EventCategory category = findCategoryOrThrow(id);

        long eventCount = eventRepository.countByCategoryId(id);
        if (eventCount > 0) {
            throw new DuplicateDataException(
                    "Không thể xoá: đang có " + eventCount + " sự kiện thuộc loại này");
        }

        categoryRepository.delete(category);
    }

    private EventCategory findCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loại sự kiện", "id", id));
    }
}
