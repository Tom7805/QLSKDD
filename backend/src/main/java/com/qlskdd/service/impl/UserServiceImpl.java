package com.qlskdd.service.impl;

import com.qlskdd.dto.request.UserReq;
import com.qlskdd.entity.Role;
import com.qlskdd.entity.User;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.exception.DuplicateDataException;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.mapper.UserMapper;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.mapper.response.UserRes;
import com.qlskdd.repository.RoleRepository;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public PageRes<UserRes> getUsers(String keyword, Pageable pageable) {
        String kw = keyword == null ? "" : keyword;
        Page<User> users = userRepository
                .findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(kw, kw, pageable);
        return PageRes.of(users.map(userMapper::toRes));
    }

    @Override
    public UserRes getById(Long id) {
        return userMapper.toRes(findUserOrThrow(id));
    }

    @Override
    public UserRes create(UserReq req) {
        // Bean Validation (@Size) không phân biệt được create/update trên cùng 1 DTO,
        // nên bắt buộc mật khẩu khi tạo mới được kiểm tra thủ công ở đây.
        if (!StringUtils.hasText(req.getPassword())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Mật khẩu không được để trống khi tạo tài khoản mới");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new DuplicateDataException("Tài khoản", "username", req.getUsername());
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateDataException("Tài khoản", "email", req.getEmail());
        }

        Role role = findRoleOrThrow(req.getRoleId());

        User user = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .role(role)
                .enabled(true)
                .build();

        return userMapper.toRes(userRepository.save(user));
    }

    @Override
    public UserRes update(Long id, UserReq req) {
        User user = findUserOrThrow(id);

        if (userRepository.existsByUsernameAndIdNot(req.getUsername(), id)) {
            throw new DuplicateDataException("Tài khoản", "username", req.getUsername());
        }
        if (userRepository.existsByEmailAndIdNot(req.getEmail(), id)) {
            throw new DuplicateDataException("Tài khoản", "email", req.getEmail());
        }

        Role role = findRoleOrThrow(req.getRoleId());

        user.setUsername(req.getUsername());
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setRole(role);
        // Chỉ đổi mật khẩu khi có nhập mới; để trống nghĩa là giữ nguyên mật khẩu cũ
        if (StringUtils.hasText(req.getPassword())) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }

        return userMapper.toRes(userRepository.save(user));
    }

    @Override
    public UserRes toggleStatus(Long id) {
        User user = findUserOrThrow(id);

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean dangKhoaChinhMinh = Boolean.TRUE.equals(user.getEnabled())
                && user.getUsername().equals(currentUsername);
        if (dangKhoaChinhMinh) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Không thể tự khoá chính tài khoản đang đăng nhập");
        }

        user.setEnabled(!Boolean.TRUE.equals(user.getEnabled()));
        return userMapper.toRes(userRepository.save(user));
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản", "id", id));
    }

    private Role findRoleOrThrow(Long roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò", "id", roleId));
    }
}
