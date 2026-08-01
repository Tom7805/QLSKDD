package com.qlskdd.mapper.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private boolean success;
    private int status;
    private String error;
    private String message;
    private String path;
    private LocalDateTime timestamp;
    private List<FieldErrorDetail> errors;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldErrorDetail {
        private String field;
        private String message;
    }
}
