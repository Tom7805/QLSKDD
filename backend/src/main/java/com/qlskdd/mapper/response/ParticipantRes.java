package com.qlskdd.mapper.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// B3.4-T3: tuyệt đối không có trường password, giống UserRes (B1.4-T4)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantRes {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private long registeredEventCount;
}
