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

    @Column(nullable = false)
    private String location;

    // B2.1: FK sang loại sự kiện — cần có để CategoryService chặn xoá loại đang còn sự
    // kiện (B2.2 sẽ hoàn thiện thêm capacity/description/createdBy cho Event).
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