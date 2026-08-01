package com.qlskdd.config;

import com.qlskdd.entity.Event;
import com.qlskdd.entity.Role;
import com.qlskdd.entity.User;
import com.qlskdd.enums.EventStatus;
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

    // ĐÂY CHÍNH LÀ HÀM RUN() BẮT BUỘC PHẢI CÓ MÀ BẠN ĐANG THIẾU
    @Override
    public void run(String... args) throws Exception {
        // 1. Tạo 3 Role mặc định
        if (roleRepository.count() == 0) {
            Role adminRole = new Role(); adminRole.setName("ROLE_ADMIN");
            Role orgRole = new Role(); orgRole.setName("ROLE_ORGANIZER");
            Role userRole = new Role(); userRole.setName("ROLE_USER");
            roleRepository.saveAll(List.of(adminRole, orgRole, userRole));
            System.out.println("Đã nạp dữ liệu mẫu: 3 Roles");
        }

        // 2. Tạo 1 tài khoản Admin
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new IllegalStateException("Chưa seed Role ROLE_ADMIN"));
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Quản trị viên Hệ thống");
            admin.setEmail("admin@qlskdd.com");
            admin.setRole(adminRole);
            userRepository.save(admin);
            System.out.println("Đã nạp dữ liệu mẫu: 1 Admin account");
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