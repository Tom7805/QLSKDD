package com.qlskdd.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(unique = true, length = 50, nullable = false)
    private String username;

    @Column(length = 60, nullable = false)
    private String password;

    @Column(name = "full_name")
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(length = 15)
    private String phone;

    /**
     * Ảnh đại diện. Chứa MỘT TRONG HAI dạng:
     *  - "preset:<tên màu>" — avatar chữ cái đầu trên nền màu người dùng chọn
     *  - data URI ảnh (data:image/...) đã được frontend cắt vuông + nén xuống ~128px
     * Cố ý không lưu file lên đĩa/S3: dự án chưa có hạ tầng lưu trữ tệp, mà ảnh đại diện
     * sau khi nén chỉ vài chục KB nên nhét thẳng vào cột TEXT là đủ và không phát sinh
     * thêm thành phần vận hành. Giới hạn kích thước được kiểm ở ProfileReq.
     */
    @Column(columnDefinition = "TEXT")
    private String avatar;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}