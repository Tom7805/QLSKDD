package com.qlskdd.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

// B4.5-T3: điểm danh bằng mã (quét QR hoặc nhập tay).
@Data
public class CheckInByCodeReq {

    @NotBlank(message = "Mã đăng ký không được để trống")
    private String code;

    @NotNull(message = "Sự kiện không được để trống")
    private Long eventId;
}
