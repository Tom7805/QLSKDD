package com.qlskdd.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

// B2.1-T3: DTO tạo/sửa loại sự kiện
@Data
public class CategoryReq {

    @NotBlank(message = "Tên loại sự kiện không được để trống")
    @Size(max = 100, message = "Tên loại sự kiện tối đa 100 ký tự")
    private String name;

    private String description;
}
