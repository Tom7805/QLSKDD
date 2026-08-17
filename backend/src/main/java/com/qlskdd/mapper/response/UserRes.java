package com.qlskdd.mapper.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Tuyệt đối không có trường password (B1.4-T4)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRes {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String avatar;
    private String role;
    private Boolean enabled;
    private LocalDateTime createdAt;
}
