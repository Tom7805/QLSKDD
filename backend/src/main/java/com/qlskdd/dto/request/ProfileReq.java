package com.qlskdd.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Dữ liệu người dùng tự sửa hồ sơ của chính mình (PUT /auth/me).
 *
 * Cố ý KHÔNG cho sửa username, email và role ở đây:
 *  - username là định danh đăng nhập, đổi được sẽ làm hỏng các token đang phát hành
 *  - email đang là cột unique, đổi cần luồng xác minh riêng
 *  - role phải do ADMIN cấp qua màn quản lý người dùng, không ai tự nâng quyền cho mình
 */
@Data
public class ProfileReq {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    private String fullName;

    @Size(max = 15, message = "Số điện thoại tối đa 15 ký tự")
    @Pattern(regexp = "^$|^[0-9+\\-\\s]{8,15}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    /**
     * "preset:<màu>" hoặc data URI ảnh đã nén ở frontend. Trần 200_000 ký tự (~150KB ảnh
     * sau khi mã hoá base64) để một ảnh gốc chưa nén không thể làm phình bảng users.
     */
    @Size(max = 200_000, message = "Ảnh đại diện quá lớn")
    private String avatar;
}
