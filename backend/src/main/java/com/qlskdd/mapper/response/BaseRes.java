package com.qlskdd.mapper.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaseRes<T> {

    private boolean success;
    private int status;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> BaseRes<T> success(T data) {
        return new BaseRes<>(true, 200, "Thành công", data, LocalDateTime.now());
    }

    public static <T> BaseRes<T> success(String message, T data) {
        return new BaseRes<>(true, 200, message, data, LocalDateTime.now());
    }

    public static <T> BaseRes<T> of(int status, String message, T data) {
        return new BaseRes<>(true, status, message, data, LocalDateTime.now());
    }
}
