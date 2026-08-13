package com.qlskdd.specification;

import com.qlskdd.entity.Event;
import com.qlskdd.entity.EventCategory;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.repository.CategoryRepository;
import com.qlskdd.repository.EventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test case B5.2-T3 (TC1/TC2/TC3): kiểm chứng EventSpecification lọc đúng trên dữ liệu
 * thật, dùng @DataJpaTest với DB nhúng H2 — vì Specification là lambda build predicate,
 * mock CriteriaBuilder chỉ xác nhận "có gọi cb.equal(...)" chứ không xác nhận truy vấn
 * thật sự lọc đúng hàng nào, nên cần chạy qua Hibernate + DB thật.
 */
@DataJpaTest
class EventSpecificationTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private EventCategory hoiThao;
    private EventCategory workshop;

    @BeforeEach
    void setUp() {
        hoiThao = categoryRepository.save(EventCategory.builder().name("Hội thảo").build());
        workshop = categoryRepository.save(EventCategory.builder().name("Workshop").build());

        saveEvent("Hội thảo AI 2026", "Hội trường A", hoiThao, EventStatus.OPEN,
                LocalDateTime.of(2026, 3, 10, 8, 0));
        saveEvent("Workshop React", "Phòng Lab B", workshop, EventStatus.CLOSED,
                LocalDateTime.of(2026, 6, 15, 8, 0));
        saveEvent("Tiệc trà cuối năm", "Sảnh chính", workshop, EventStatus.OPEN,
                LocalDateTime.of(2026, 12, 20, 8, 0));
    }

    private void saveEvent(String name, String location, EventCategory category, EventStatus status,
                            LocalDateTime startAt) {
        Event event = new Event();
        event.setName(name);
        event.setLocation(location);
        event.setCategory(category);
        event.setStatus(status);
        event.setStartAt(startAt);
        event.setEndAt(startAt.plusHours(2));
        eventRepository.save(event);
    }

    private Pageable pageable() {
        return PageRequest.of(0, 10);
    }

    /**
     * TC1: lọc theo categoryId -> chỉ ra sự kiện đúng loại.
     */
    @Test
    void filter_TC1_LocTheoCategoryId_ChiRaSuKienDungLoai() {
        var spec = EventSpecification.filter(null, workshop.getId(), null, null, null);

        Page<Event> result = eventRepository.findAll(spec, pageable());

        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream().allMatch(e -> e.getCategory().getId().equals(workshop.getId())));
    }

    /**
     * TC2: lọc khoảng thời gian (from/to theo startAt) -> chỉ ra sự kiện trong khoảng.
     */
    @Test
    void filter_TC2_LocKhoangThoiGian_ChiRaSuKienTrongKhoang() {
        var spec = EventSpecification.filter(null, null, null,
                LocalDate.of(2026, 3, 1), LocalDate.of(2026, 6, 30));

        Page<Event> result = eventRepository.findAll(spec, pageable());

        List<String> names = result.getContent().stream().map(Event::getName).toList();
        assertEquals(2, result.getTotalElements());
        assertTrue(names.containsAll(List.of("Hội thảo AI 2026", "Workshop React")));
        assertTrue(names.stream().noneMatch(n -> n.equals("Tiệc trà cuối năm")));
    }

    /**
     * TC3: kết hợp keyword + category + status -> kết quả thoả cả 3 điều kiện (AND).
     */
    @Test
    void filter_TC3_KetHopKeywordCategoryStatus_KetQuaThoaCa3() {
        var spec = EventSpecification.filter("workshop", workshop.getId(), "CLOSED", null, null);

        Page<Event> result = eventRepository.findAll(spec, pageable());

        assertEquals(1, result.getTotalElements());
        assertEquals("Workshop React", result.getContent().get(0).getName());
    }

    /**
     * Kết hợp không khớp gì (đúng category nhưng sai status) -> content rỗng, không lỗi.
     */
    @Test
    void filter_KetHopKhongKhop_ContentRong() {
        var spec = EventSpecification.filter(null, hoiThao.getId(), "CLOSED", null, null);

        Page<Event> result = eventRepository.findAll(spec, pageable());

        assertEquals(0, result.getTotalElements());
    }

    /**
     * Không truyền điều kiện nào -> trả toàn bộ (giữ đúng hành vi cũ của B2.5 khi chưa có
     * bộ lọc nào).
     */
    @Test
    void filter_KhongTruyenDieuKienNao_TraToanBo() {
        var spec = EventSpecification.filter(null, null, null, null, null);

        Page<Event> result = eventRepository.findAll(spec, pageable());

        assertEquals(3, result.getTotalElements());
    }
}
