package com.qlskdd.mapper;

import com.qlskdd.entity.User;
import com.qlskdd.mapper.response.UserRes;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserRes toRes(User user) {
        return UserRes.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .role(user.getRole().getName())
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
