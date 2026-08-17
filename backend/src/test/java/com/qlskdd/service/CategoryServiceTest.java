package com.qlskdd.service;

import com.qlskdd.dto.request.CategoryReq;
import com.qlskdd.entity.EventCategory;
import com.qlskdd.exception.DuplicateDataException;
import com.qlskdd.mapper.CategoryMapper;
import com.qlskdd.repository.CategoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.service.impl.CategoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test case B2.1-T5: quản lý loại sự kiện.
 * CategoryMapper không mock (dùng bản thật) vì chỉ là logic ánh xạ đơn giản.
 */
@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private EventRepository eventRepository;

    private final CategoryMapper categoryMapper = new CategoryMapper();

    private CategoryServiceImpl categoryService;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryServiceImpl(categoryRepository, eventRepository, categoryMapper);
    }

    private CategoryReq buildValidReq(String name) {
        CategoryReq req = new CategoryReq();
        req.setName(name);
        req.setDescription("Mô tả loại sự kiện");
        return req;
    }

    @Test
    void testCreate_TC1_TrungTenKhacHoaThuong_NemDuplicateDataException() {
        CategoryReq req = buildValidReq("hội thảo");
        when(categoryRepository.existsByNameIgnoreCase("hội thảo")).thenReturn(true);

        assertThrows(DuplicateDataException.class, () -> categoryService.create(req));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void testDelete_TC2_XoaLoaiDangCoSuKien_NemDuplicateDataExceptionKemSoLuong() {
        EventCategory category = EventCategory.builder().id(1L).name("Hội thảo").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(eventRepository.countByCategoryId(1L)).thenReturn(3L);

        DuplicateDataException ex = assertThrows(DuplicateDataException.class,
                () -> categoryService.delete(1L));

        assertTrue(ex.getMessage().contains("3"), "Message lỗi phải nêu rõ số lượng sự kiện: " + ex.getMessage());
        verify(categoryRepository, never()).delete(any());
    }

    @Test
    void testDelete_TC3_XoaLoaiChuaCoSuKien_XoaThanhCong() {
        EventCategory category = EventCategory.builder().id(2L).name("Workshop").build();
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(category));
        when(eventRepository.countByCategoryId(2L)).thenReturn(0L);

        categoryService.delete(2L);

        verify(categoryRepository).delete(category);
    }
}
