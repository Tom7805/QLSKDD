package com.qlskdd.service;

import com.qlskdd.dto.request.LoginReq;
import com.qlskdd.mapper.response.LoginRes;

public interface AuthService {
    LoginRes login(LoginReq request);
    
    // Bổ sung phương thức lấy thông tin user hiện tại
    LoginRes.UserLoginInfo getCurrentUserInfo(String username);
}