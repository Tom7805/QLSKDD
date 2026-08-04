package com.qlskdd.entity;

import com.qlskdd.enums.EventStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Data
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String location;

    // Không NOT NULL ở DB: 3 sự kiện mẫu do DataSeeder tạo (B0.4) chưa set capacity —
    // ràng buộc bắt buộc >0 chỉ áp dụng khi tạo mới qua API (EventReq @NotNull @Positive)
    private Integer capacity;

    // B2.1: FK sang loại sự kiện — cần có để CategoryService chặn xoá loại đang còn sự
    // kiện. Cũng không NOT NULL vì lý do tương tự capacity.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private EventCategory category;

    private LocalDateTime startAt;
    
    private LocalDateTime endAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.OPEN;

    @Column(name = "created_by")
    private String createdBy;

    private LocalDateTime createdAt = LocalDateTime.now();
}