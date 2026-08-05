package com.qlskdd.exception;

import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public BusinessException(String message) {
        this(HttpStatus.BAD_REQUEST, message, "BAD_REQUEST");
    }

    public BusinessException(HttpStatus status, String message) {
        this(status, message, status.name());
    }

    public BusinessException(HttpStatus status, String message, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
