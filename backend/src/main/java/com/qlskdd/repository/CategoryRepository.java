package com.qlskdd.repository;

import com.qlskdd.entity.EventCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<EventCategory, Long> {

    boolean existsByNameIgnoreCase(String name);

    // B2.1-T3: khi sửa, bỏ qua chính bản ghi đang sửa để không tự báo trùng với chính nó
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    Optional<EventCategory> findByNameIgnoreCase(String name);
}
