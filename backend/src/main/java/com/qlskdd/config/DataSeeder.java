package com.qlskdd.config;

import com.qlskdd.entity.Event;
import com.qlskdd.entity.Role;
import com.qlskdd.entity.User;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.enums.RoleEnum;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RoleRepository;
import com.qlskdd.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(RoleRepository roleRepository, UserRepository userRepository, EventRepository eventRepository,
                       PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Tạo 3 Role mặc định
        if (roleRepository.count() == 0) {
            Role adminRole = Role.builder().name(RoleEnum.ROLE_ADMIN.name()).build();
            Role organizerRole = Role.builder().name(RoleEnum.ROLE_ORGANIZER.name()).build();
            Role userRole = Role.builder().name(RoleEnum.ROLE_USER.name()).build();
            roleRepository.saveAll(List.of(adminRole, organizerRole, userRole));
            System.out.println("Đã nạp dữ liệu mẫu: 3 Roles");
        }

        // 2. Tạo 3 tài khoản mẫu nếu bảng user rỗng
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName(RoleEnum.ROLE_ADMIN.name())
                    .orElseThrow(() -> new IllegalStateException("Chưa seed Role ROLE_ADMIN"));
            Role organizerRole = roleRepository.findByName(RoleEnum.ROLE_ORGANIZER.name())
                    .orElseThrow(() -> new IllegalStateException("Chưa seed Role ROLE_ORGANIZER"));
            Role userRole = roleRepository.findByName(RoleEnum.ROLE_USER.name())
                    .orElseThrow(() -> new IllegalStateException("Chưa seed Role ROLE_USER"));

            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Quản trị viên Hệ thống")
                    .email("admin@qlskdd.com")
                    .phone("0901234567")
                    .role(adminRole)
                    .enabled(true)
                    .build();

            User organizer = User.builder()
                    .username("organizer")
                    .password(passwordEncoder.encode("organizer123"))
                    .fullName("Ban tổ chức")
                    .email("organizer@qlskdd.com")
                    .phone("0907654321")
                    .role(organizerRole)
                    .enabled(true)
                    .build();

            User user = User.builder()
                    .username("user")
                    .password(passwordEncoder.encode("user123"))
                    .fullName("Người tham gia")
                    .email("user@qlskdd.com")
                    .phone("0912345678")
                    .role(userRole)
                    .enabled(true)
                    .build();

            userRepository.saveAll(List.of(admin, organizer, user));
            System.out.println("Đã nạp dữ liệu mẫu: 3 tài khoản mẫu (admin/organizer/user)");
        }

        // 3. Tạo 3 sự kiện mẫu
        if (eventRepository.count() == 0) {
            Event e1 = new Event();
            e1.setName("Hội thảo Trí tuệ nhân tạo 2026");
            e1.setLocation("Hội trường A");
            e1.setStartAt(LocalDateTime.now().plusDays(5).withHour(8).withMinute(0));
            e1.setEndAt(LocalDateTime.now().plusDays(5).withHour(11).withMinute(0));
            e1.setStatus(EventStatus.OPEN);

            Event e2 = new Event();
            e2.setName("Lễ ra mắt sản phẩm mới");
            e2.setLocation("Phòng 302");
            e2.setStartAt(LocalDateTime.now().plusDays(10).withHour(14).withMinute(0));
            e2.setEndAt(LocalDateTime.now().plusDays(10).withHour(16).withMinute(0));
            e2.setStatus(EventStatus.OPEN);

            Event e3 = new Event();
            e3.setName("Khóa đào tạo kỹ năng mềm");
            e3.setLocation("Hội trường B");
            e3.setStartAt(LocalDateTime.now().plusDays(15).withHour(9).withMinute(0));
            e3.setEndAt(LocalDateTime.now().plusDays(15).withHour(17).withMinute(0));
            e3.setStatus(EventStatus.OPEN);

            eventRepository.saveAll(List.of(e1, e2, e3));
            System.out.println("Đã nạp dữ liệu mẫu: 3 Events");
        }
    }
}