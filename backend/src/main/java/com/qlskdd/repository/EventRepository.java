package com.qlskdd.repository;

import com.qlskdd.entity.Event;
import com.qlskdd.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    // B2.1-T2: đếm số sự kiện thuộc 1 loại — dùng khi chặn xoá loại đó
    long countByCategoryId(Long categoryId);

    // B2.1-T4: đếm eventCount cho TOÀN BỘ danh sách loại sự kiện bằng đúng 1 truy vấn
    // group by, tránh chạy countByCategoryId lặp lại cho từng loại (N+1)
    @Query("SELECT e.category.id, COUNT(e) FROM Event e WHERE e.category IS NOT NULL GROUP BY e.category.id")
    List<Object[]> countEventsGroupedByCategory();

    // B5.1-T1 + B5.2-T1: tìm/lọc GET /events giờ đi qua JpaSpecificationExecutor.findAll(spec,
    // pageable) — xem EventSpecification.filter(). Bản findByNameContainingIgnoreCaseOr...
    // (B5.1-T1 gốc) đã bị thay thế vì EventSpecification là tập hợp lớn hơn (keyword + category
    // + status + from/to), tránh 2 đường lọc trùng lặp trên cùng 1 endpoint.

    // B5.4-T1: số sự kiện sẽ diễn ra trong tương lai (startAt > now) và còn mở đăng ký
    // (status = OPEN) — 1 trong 4 chỉ số của GET /api/v1/dashboard/summary.
    long countByStartAtAfterAndStatus(LocalDateTime startAtAfter, EventStatus status);
}