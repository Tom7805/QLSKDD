package com.qlskdd.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// B2.2-T3: gắn lên EventReq để EventTimeValidator kiểm tra endAt phải sau startAt —
// class-level vì cần so sánh chéo 2 trường trong cùng request.
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = EventTimeValidator.class)
public @interface ValidEventTime {

    String message() default "Thời gian không hợp lệ";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
