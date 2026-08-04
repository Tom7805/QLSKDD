package com.qlskdd.validator;

import com.qlskdd.dto.request.EventReq;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

// B2.2-T3: endAt phải sau startAt. Lỗi gắn vào field "endAt" (addPropertyNode) để
// GlobalExceptionHandler gom đúng vào errors[] giống mọi lỗi @Valid khác.
public class EventTimeValidator implements ConstraintValidator<ValidEventTime, EventReq> {

    @Override
    public boolean isValid(EventReq req, ConstraintValidatorContext context) {
        if (req == null || req.getStartAt() == null || req.getEndAt() == null) {
            // Để @NotNull trên từng trường tự báo lỗi, tránh báo trùng lặp
            return true;
        }

        if (!req.getEndAt().isAfter(req.getStartAt())) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Thời gian kết thúc phải sau thời gian bắt đầu")
                    .addPropertyNode("endAt")
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}
