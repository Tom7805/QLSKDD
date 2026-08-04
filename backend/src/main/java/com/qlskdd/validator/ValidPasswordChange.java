package com.qlskdd.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// B1.5-T2: gắn lên ChangePasswordReq để PasswordValidator kiểm tra chéo 3 trường
// oldPassword/newPassword/confirmPassword.
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
public @interface ValidPasswordChange {

    String message() default "Mật khẩu không hợp lệ";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
