package com.qlskdd.entity;

import com.qlskdd.enums.CheckInStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

// B4.1-T1: mỗi lượt đăng ký chỉ được điểm danh đúng 1 lần — ràng buộc unique trên
// registration_id chống điểm danh trùng ngay ở tầng DB (không chỉ dựa vào check ở service).
@Entity
@Table(name = "check_in_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckInHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id", nullable = false, unique = true)
    private Registration registration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by", nullable = false)
    private User checkedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CheckInStatus status;

    @CreationTimestamp
    @Column(name = "checked_in_at", updatable = false)
    private LocalDateTime checkedInAt;
}
