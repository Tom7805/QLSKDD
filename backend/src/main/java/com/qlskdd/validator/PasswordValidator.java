package com.qlskdd.validator;

import com.qlskdd.dto.request.ChangePasswordReq;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

// B1.5-T2: PasswordValidator
// Quy tắc: mật khẩu mới >=8 ký tự, có ít nhất 1 chữ và 1 số; newPassword phải khác
// oldPassword; confirmPassword phải trùng newPassword.
// Lỗi được gắn vào đúng field (addPropertyNode) để GlobalExceptionHandler gom thành
// { field: message } giống mọi lỗi @Valid khác, thay vì rơi vào lỗi chung chung.
public class PasswordValidator implements ConstraintValidator<ValidPasswordChange, ChangePasswordReq> {

    private static final Pattern HAS_LETTER = Pattern.compile(".*[A-Za-z].*");
    private static final Pattern HAS_DIGIT = Pattern.compile(".*\\d.*");

    @Override
    public boolean isValid(ChangePasswordReq req, ConstraintValidatorContext context) {
        if (req == null || !StringUtils.hasText(req.getNewPassword())) {
            // Để @NotBlank trên từng trường tự báo lỗi, tránh báo trùng lặp
            return true;
        }

        boolean valid = true;
        context.disableDefaultConstraintViolation();

        String newPassword = req.getNewPassword();
        if (newPassword.length() < 8 || !HAS_LETTER.matcher(newPassword).matches()
                || !HAS_DIGIT.matcher(newPassword).matches()) {
            addFieldError(context, "newPassword", "Mật khẩu mới phải có ít nhất 8 ký tự, gồm ít nhất 1 chữ và 1 số");
            valid = false;
        } else if (newPassword.equals(req.getOldPassword())) {
            addFieldError(context, "newPassword", "Mật khẩu mới phải khác mật khẩu hiện tại");
            valid = false;
        }

        if (StringUtils.hasText(req.getConfirmPassword()) && !newPassword.equals(req.getConfirmPassword())) {
            addFieldError(context, "confirmPassword", "Xác nhận mật khẩu không khớp với mật khẩu mới");
            valid = false;
        }

        return valid;
    }

    private void addFieldError(ConstraintValidatorContext context, String field, String message) {
        context.buildConstraintViolationWithTemplate(message)
                .addPropertyNode(field)
                .addConstraintViolation();
    }
}
