package com.qlskdd.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserReq {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 4, max = 50, message = "Tên đăng nhập phải từ 4 đến 50 ký tự")
    private String username;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại phải có 10 số và bắt đầu bằng 0")
    private String phone;

    @NotNull(message = "Vai trò không được để trống")
    private Long roleId;

    // Bắt buộc khi tạo mới (kiểm tra thủ công ở UserServiceImpl.create vì Bean Validation
    // không tự phân biệt được create/update trên cùng 1 DTO); khi sửa để trống nghĩa là
    // giữ nguyên mật khẩu cũ. @Size không áp dụng cho giá trị null nên không ảnh hưởng
    // trường hợp sửa mà không đổi mật khẩu.
    @Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự")
    private String password;
}
