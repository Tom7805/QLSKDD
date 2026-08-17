package com.qlskdd.mapper.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegistrationRes {
    private Long registrationId;
    private String code;
    private String eventName;
}
