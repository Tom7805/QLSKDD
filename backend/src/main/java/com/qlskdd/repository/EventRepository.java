package com.qlskdd.repository;

import com.qlskdd.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    // B2.1-T2: đếm số sự kiện thuộc 1 loại — dùng khi chặn xoá loại đó
    long countByCategoryId(Long categoryId);

    // B2.1-T4: đếm eventCount cho TOÀN BỘ danh sách loại sự kiện bằng đúng 1 truy vấn
    // group by, tránh chạy countByCategoryId lặp lại cho từng loại (N+1)
    @Query("SELECT e.category.id, COUNT(e) FROM Event e WHERE e.category IS NOT NULL GROUP BY e.category.id")
    List<Object[]> countEventsGroupedByCategory();
}