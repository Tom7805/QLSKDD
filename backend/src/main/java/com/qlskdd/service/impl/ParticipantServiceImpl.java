package com.qlskdd.service.impl;

import com.qlskdd.dto.request.ParticipantReq;
import com.qlskdd.entity.Role;
import com.qlskdd.entity.User;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.enums.RoleEnum;
import com.qlskdd.exception.BusinessException;
import com.qlskdd.exception.DuplicateDataException;
import com.qlskdd.exception.ResourceNotFoundException;
import com.qlskdd.mapper.response.PageRes;
import com.qlskdd.mapper.response.ParticipantRes;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.repository.RoleRepository;
import com.qlskdd.repository.UserRepository;
import com.qlskdd.service.ParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ParticipantServiceImpl implements ParticipantService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RegistrationRepository registrationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public PageRes<ParticipantRes> getParticipants(String keyword, Long eventId,
                                                   RegistrationStatus status, Pageable pageable) {
        String kw = keyword == null ? "" : keyword;
        Page<User> participants;
        if (eventId != null) {
            // B5.3-T1/T2: lọc theo sự kiện (+ tuỳ chọn status). Truyền thẳng status đã được
            // chọn (có thể null) — repository tự bỏ qua điều kiện status khi null.
            participants = userRepository.findByRoleAndKeywordAndEvent(
                    RoleEnum.ROLE_USER.name(), kw, eventId, status, pageable);
        } else {
            participants = userRepository.findByRoleNameAndKeyword(RoleEnum.ROLE_USER.name(), kw, pageable);
        }

        // B3.4-T1: đếm số đăng ký ACTIVE cho CẢ TRANG bằng đúng 1 truy vấn group by,
        // không lặp countByUserIdAndStatus cho từng người (tránh N+1)
        List<Long> userIds = participants.getContent().stream().map(User::getId).toList();
        Map<Long, Long> activeCountByUserId = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (Object[] row : registrationRepository
                    .countGroupedByUserIdsAndStatus(userIds, RegistrationStatus.ACTIVE)) {
                activeCountByUserId.put((Long) row[0], (Long) row[1]);
            }
        }

        Page<ParticipantRes> resPage = participants.map(user -> toRes(user,
                activeCountByUserId.getOrDefault(user.getId(), 0L)));
        return PageRes.of(resPage);
    }

    @Override
    public ParticipantRes getById(Long id) {
        User user = findParticipantOrThrow(id);
        long count = registrationRepository.countByUserIdAndStatus(id, RegistrationStatus.ACTIVE);
        return toRes(user, count);
    }

    @Override
    public ParticipantRes create(ParticipantReq req) {
        // Giống UserServiceImpl.create (B1.4-T2): @Size không phân biệt được create/update
        // trên cùng 1 DTO, nên bắt buộc mật khẩu khi tạo mới được kiểm tra thủ công.
        if (!StringUtils.hasText(req.getPassword())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Mật khẩu không được để trống khi tạo mới");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new DuplicateDataException("Người tham gia", "username", req.getUsername());
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateDataException("Email đã tồn tại");
        }

        Role userRole = roleRepository.findByName(RoleEnum.ROLE_USER.name())
                .orElseThrow(() -> new IllegalStateException("Chưa seed Role ROLE_USER"));

        User user = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .role(userRole)
                .enabled(true)
                .build();

        return toRes(userRepository.save(user), 0L);
    }

    @Override
    public ParticipantRes update(Long id, ParticipantReq req) {
        User user = findParticipantOrThrow(id);

        if (userRepository.existsByUsernameAndIdNot(req.getUsername(), id)) {
            throw new DuplicateDataException("Người tham gia", "username", req.getUsername());
        }
        if (userRepository.existsByEmailAndIdNot(req.getEmail(), id)) {
            throw new DuplicateDataException("Email đã tồn tại");
        }

        user.setUsername(req.getUsername());
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        // Chỉ đổi mật khẩu khi có nhập mới; để trống nghĩa là giữ nguyên mật khẩu cũ
        if (StringUtils.hasText(req.getPassword())) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }

        long count = registrationRepository.countByUserIdAndStatus(id, RegistrationStatus.ACTIVE);
        return toRes(userRepository.save(user), count);
    }

    @Override
    public void delete(Long id) {
        User user = findParticipantOrThrow(id);

        // B3.4-T2: chặn xoá khi còn lượt đăng ký ACTIVE
        long activeCount = registrationRepository.countByUserIdAndStatus(id, RegistrationStatus.ACTIVE);
        if (activeCount > 0) {
            throw new BusinessException(HttpStatus.CONFLICT,
                    "Không thể xoá: người này còn " + activeCount + " lượt đăng ký");
        }

        userRepository.delete(user);
    }

    private User findParticipantOrThrow(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người tham gia", "id", id));
        if (!RoleEnum.ROLE_USER.name().equals(user.getRole().getName())) {
            throw new ResourceNotFoundException("Người tham gia", "id", id);
        }
        return user;
    }

    private ParticipantRes toRes(User user, long registeredEventCount) {
        return ParticipantRes.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .registeredEventCount(registeredEventCount)
                .build();
    }
}
