package com.qlskdd.dto.request;

import com.qlskdd.validator.ValidEventTime;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

// B2.2-T3: DTO tạo/sửa sự kiện. @ValidEventTime kiểm tra chéo endAt > startAt.
@Data
@ValidEventTime
public class EventReq {

    @NotBlank(message = "Tên sự kiện không được để trống")
    @Size(max = 255, message = "Tên sự kiện tối đa 255 ký tự")
    private String name;

    private String description;

    @NotBlank(message = "Địa điểm không được để trống")
    private String location;

    @NotNull(message = "Sức chứa không được để trống")
    @Positive(message = "Sức chứa phải lớn hơn 0")
    private Integer capacity;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    @Future(message = "Thời gian bắt đầu phải ở tương lai")
    private LocalDateTime startAt;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endAt;

    @NotNull(message = "Loại sự kiện không được để trống")
    private Long categoryId;
}
