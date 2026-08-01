package com.qlskdd.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.qlskdd.mapper.response.ErrorResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex, HttpServletRequest request) {
        return build(ex.getStatus(), ex.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex,
                                                                     HttpServletRequest request) {
        List<ErrorResponse.FieldErrorDetail> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> ErrorResponse.FieldErrorDetail.builder()
                        .field(fe.getField())
                        .message(fe.getDefaultMessage())
                        .build())
                .collect(Collectors.toList());
        return build(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ", request, fieldErrors);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập tài nguyên này", request, null);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau", request, null);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, HttpServletRequest request,
                                                 List<ErrorResponse.FieldErrorDetail> errors) {
        ErrorResponse body = ErrorResponse.builder()
                .success(false)
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .errors(errors)
                .build();
        return ResponseEntity.status(status).body(body);
    }
}
