package com.qlskdd.exception;

import org.springframework.http.HttpStatus;

public class DuplicateDataException extends BusinessException {

    public DuplicateDataException(String message) {
        super(HttpStatus.CONFLICT, message);
    }

    public DuplicateDataException(String resource, String field, Object value) {
        super(HttpStatus.CONFLICT, String.format("%s đã tồn tại với %s = '%s'", resource, field, value));
    }
}
