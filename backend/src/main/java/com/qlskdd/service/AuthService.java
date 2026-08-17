package com.qlskdd.service;

import com.qlskdd.dto.request.LoginReq;
import com.qlskdd.dto.request.ProfileReq;
import com.qlskdd.mapper.response.LoginRes;

public interface AuthService {
    LoginRes login(LoginReq request);
    
    // Bổ sung phương thức lấy thông tin user hiện tại
    LoginRes.UserLoginInfo getCurrentUserInfo(String username);

    // Người dùng tự cập nhật hồ sơ của chính mình (họ tên, điện thoại, ảnh đại diện)
    LoginRes.UserLoginInfo updateProfile(String username, ProfileReq request);
}