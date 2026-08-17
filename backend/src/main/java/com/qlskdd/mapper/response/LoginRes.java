package com.qlskdd.mapper.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRes {
    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private UserLoginInfo user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserLoginInfo {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phone;
        private String role;

        // Ảnh đại diện: "preset:<màu>" hoặc data URI (xem User.avatar)
        private String avatar;
    }
}