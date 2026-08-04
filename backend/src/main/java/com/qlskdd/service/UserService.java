package com.qlskdd.service;

import com.qlskdd.dto.request.UserReq;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.mapper.response.UserRes;
import org.springframework.data.domain.Pageable;

public interface UserService {
    PageRes<UserRes> getUsers(String keyword, Pageable pageable);

    UserRes getById(Long id);

    UserRes create(UserReq req);

    UserRes update(Long id, UserReq req);

    UserRes toggleStatus(Long id);
}
