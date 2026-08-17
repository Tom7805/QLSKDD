package com.qlskdd.exception;

import org.springframework.http.HttpStatus;

public class OverbookingException extends BusinessException {

    public OverbookingException(String message) {
        super(HttpStatus.CONFLICT, message, "OVERBOOKING");
    }
}
