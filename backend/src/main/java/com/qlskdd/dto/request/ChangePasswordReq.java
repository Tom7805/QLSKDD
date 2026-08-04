package com.qlskdd.dto.request;

import com.qlskdd.validator.ValidPasswordChange;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// B1.5-T1: body của PUT /api/v1/users/me/password.
// @ValidPasswordChange đặt ở class-level vì cần so sánh chéo newPassword với
// oldPassword và confirmPassword (Bean Validation field-level không làm được việc này).
@Data
@ValidPasswordChange
public class ChangePasswordReq {

    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String oldPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;
}
