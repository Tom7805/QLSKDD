package com.qlskdd.config;

import com.qlskdd.entity.Event;
import com.qlskdd.entity.EventCategory;
import com.qlskdd.entity.Registration;
import com.qlskdd.entity.Role;
import com.qlskdd.entity.User;
import com.qlskdd.enums.CheckInStatus;
import com.qlskdd.enums.EventStatus;
import com.qlskdd.enums.RegistrationStatus;
import com.qlskdd.enums.RoleEnum;
import com.qlskdd.repository.CategoryRepository;
import com.qlskdd.repository.CheckInHistoryRepository;
import com.qlskdd.repository.EventRepository;
import com.qlskdd.repository.RegistrationRepository;
import com.qlskdd.repository.RoleRepository;
import com.qlskdd.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@Profile("demo")
public class DemoSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final CheckInHistoryRepository checkInHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    /*
     * B6.5: mật khẩu tài khoản demo đọc từ cấu hình, mặc định giữ nguyên giá trị cũ.
     *
     * Ở máy cá nhân thì không có gì thay đổi — vẫn admin123/organizer123/user123 như tài liệu
     * demo đã ghi. Nhưng bản deploy lên Render có URL công khai trên internet: để mật khẩu
     * mặc định nằm trong mã nguồn thì bất kỳ ai tìm ra địa chỉ đều đăng nhập được với quyền
     * quản trị và xoá sửa dữ liệu. Trên Render sẽ đặt 3 biến này thành mật khẩu riêng của nhóm.
     */
    @Value("${app.demo.admin-password:admin123}")
    private String demoAdminPassword;

    @Value("${app.demo.organizer-password:organizer123}")
    private String demoOrganizerPassword;

    @Value("${app.demo.user-password:user123}")
    private String demoUserPassword;

    public DemoSeeder(RoleRepository roleRepository,
                      UserRepository userRepository,
                      CategoryRepository categoryRepository,
                      EventRepository eventRepository,
                      RegistrationRepository registrationRepository,
                      CheckInHistoryRepository checkInHistoryRepository,
                      PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.checkInHistoryRepository = checkInHistoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Chỉ chạy khi database demo đang trống để tránh dữ liệu lẫn nhau.
        if (userRepository.count() > 0 || eventRepository.count() > 0 || registrationRepository.count() > 0) {
            // Nói rõ cách dựng lại: nếu chỉ in "bỏ qua" thì lúc lên demo mà thiếu dữ liệu sẽ
            // không ai biết phải làm gì, mà đó đúng là lúc không có thời gian mò.
            System.out.println("DemoSeeder: database đã có dữ liệu nên bỏ qua tạo mới. "
                    + "Muốn dựng lại dữ liệu demo sạch: DROP DATABASE qlsk_dd_demo; rồi chạy lại profile demo.");
            return;
        }

        Role adminRole = ensureRole(RoleEnum.ROLE_ADMIN.name());
        Role organizerRole = ensureRole(RoleEnum.ROLE_ORGANIZER.name());
        Role userRole = ensureRole(RoleEnum.ROLE_USER.name());

        User admin = userRepository.save(User.builder()
                .username("demo_admin")
                .password(passwordEncoder.encode(demoAdminPassword))
                .fullName("Quản trị viên Demo")
                .email("demo.admin@qlskdd.com")
                .phone("0901000001")
                .role(adminRole)
                .enabled(true)
                .build());

        User organizer = userRepository.save(User.builder()
                .username("demo_organizer")
                .password(passwordEncoder.encode(demoOrganizerPassword))
                .fullName("Ban tổ chức Demo")
                .email("demo.organizer@qlskdd.com")
                .phone("0901000002")
                .role(organizerRole)
                .enabled(true)
                .build());

        List<User> participants = new ArrayList<>();
        String[] participantNames = {
                "Nguyễn Thị Lan", "Trần Văn Minh", "Lê Hoài Nam", "Phạm Thanh Huyền",
                "Hoàng Đức Anh", "Đỗ Minh Khang", "Vũ Thảo Nhi", "Ngô Quốc Dũng",
                "Bùi Anh Tú", "Mai Hồng Loan"
        };

        for (int i = 0; i < participantNames.length; i++) {
            participants.add(userRepository.save(User.builder()
                    .username("participant_" + (i + 1))
                    .password(passwordEncoder.encode(demoUserPassword))
                    .fullName(participantNames[i])
                    .email("participant" + (i + 1) + "@qlskdd.com")
                    .phone("0902000" + String.format("%03d", i + 1))
                    .role(userRole)
                    .enabled(true)
                    .build()));
        }

        EventCategory workshopCategory = ensureCategory("Workshop");
        EventCategory conferenceCategory = ensureCategory("Hội thảo");
        EventCategory communityCategory = ensureCategory("Team building");

        LocalDateTime now = LocalDateTime.now();

        Event openEvent = new Event();
        openEvent.setName("Hội thảo AI cho doanh nghiệp");
        openEvent.setDescription("Demo workflow đăng ký, điểm danh và thống kê công suất.");
        openEvent.setLocation("Hội trường A - Tầng 3");
        openEvent.setCapacity(30);
        openEvent.setCategory(conferenceCategory);
        openEvent.setStartAt(now.plusDays(2).withHour(9).withMinute(0).withSecond(0).withNano(0));
        openEvent.setEndAt(now.plusDays(2).withHour(11).withMinute(30).withSecond(0).withNano(0));
        openEvent.setStatus(EventStatus.OPEN);
        openEvent.setCreatedBy(organizer.getUsername());

        Event closedEvent = new Event();
        closedEvent.setName("Workshop Nâng cao kỹ năng thuyết trình");
        closedEvent.setDescription("Sự kiện đã đóng, có lượt đăng ký và kết quả điểm danh rõ ràng.");
        closedEvent.setLocation("Phòng 302 - Nhà C");
        closedEvent.setCapacity(20);
        closedEvent.setCategory(workshopCategory);
        closedEvent.setStartAt(now.minusDays(2).withHour(13).withMinute(0).withSecond(0).withNano(0));
        closedEvent.setEndAt(now.minusDays(2).withHour(15).withMinute(0).withSecond(0).withNano(0));
        closedEvent.setStatus(EventStatus.CLOSED);
        closedEvent.setCreatedBy(organizer.getUsername());

        Event cancelledEvent = new Event();
        cancelledEvent.setName("Team building cuối năm");
        cancelledEvent.setDescription("Sự kiện đã huỷ để minh họa trạng thái không mở đăng ký.");
        cancelledEvent.setLocation("Vườn quốc gia");
        cancelledEvent.setCapacity(25);
        cancelledEvent.setCategory(communityCategory);
        cancelledEvent.setStartAt(now.plusDays(12).withHour(8).withMinute(0).withSecond(0).withNano(0));
        cancelledEvent.setEndAt(now.plusDays(12).withHour(17).withMinute(0).withSecond(0).withNano(0));
        cancelledEvent.setStatus(EventStatus.CANCELLED);
        cancelledEvent.setCreatedBy(organizer.getUsername());

        // Sự kiện thứ 4: CÒN MỞ nhưng đã kín chỗ (capacity 5, sẽ nạp đúng 5 đăng ký ACTIVE).
        // Chống overbooking là tính năng đầu bảng của dự án; nếu mọi sự kiện demo đều còn chỗ
        // thì trên sân khấu không có cách nào bấm ra được lỗi "Sự kiện đã hết chỗ".
        Event fullEvent = new Event();
        fullEvent.setName("Workshop Thiết kế giao diện (đã kín chỗ)");
        fullEvent.setDescription("Sự kiện còn mở nhưng đã đủ số lượng — dùng để minh hoạ chặn đăng ký khi hết chỗ.");
        fullEvent.setLocation("Phòng Lab 1 - Nhà B");
        fullEvent.setCapacity(5);
        fullEvent.setCategory(workshopCategory);
        fullEvent.setStartAt(now.plusDays(5).withHour(14).withMinute(0).withSecond(0).withNano(0));
        fullEvent.setEndAt(now.plusDays(5).withHour(17).withMinute(0).withSecond(0).withNano(0));
        fullEvent.setStatus(EventStatus.OPEN);
        fullEvent.setCreatedBy(organizer.getUsername());

        List<Event> savedEvents = eventRepository.saveAll(
                List.of(openEvent, closedEvent, cancelledEvent, fullEvent));

        Event eventOpen = savedEvents.get(0);
        Event eventClosed = savedEvents.get(1);
        Event eventCancelled = savedEvents.get(2);
        Event eventFull = savedEvents.get(3);

        List<Registration> registrations = new ArrayList<>();

        for (int i = 0; i < 6; i++) {
            registrations.add(createRegistration(eventOpen, participants.get(i), RegistrationStatus.ACTIVE));
        }
        registrations.add(createRegistration(eventOpen, participants.get(7), RegistrationStatus.CANCELLED));

        for (int i = 0; i < 4; i++) {
            registrations.add(createRegistration(eventClosed, participants.get(i + 3), RegistrationStatus.ACTIVE));
        }

        for (int i = 0; i < 2; i++) {
            registrations.add(createRegistration(eventCancelled, participants.get(i + 8), RegistrationStatus.ACTIVE));
        }

        // Nạp ĐÚNG capacity (5) đăng ký ACTIVE cho sự kiện kín chỗ. Dùng lại participant 0..4:
        // ràng buộc unique là (event_id, user_id) nên cùng một người đăng ký sự kiện khác không sao.
        for (int i = 0; i < eventFull.getCapacity(); i++) {
            registrations.add(createRegistration(eventFull, participants.get(i), RegistrationStatus.ACTIVE));
        }

        registrationRepository.saveAll(registrations);

        // Điểm danh cho 1 phần sự kiện để thống kê hiển thị trên dashboard.
        List<Registration> openRegistrations = registrationRepository.findByEventIdAndStatus(eventOpen.getId(), RegistrationStatus.ACTIVE);
        for (int i = 0; i < Math.min(4, openRegistrations.size()); i++) {
            saveCheckIn(openRegistrations.get(i), organizer, CheckInStatus.SUCCESS);
        }

        List<Registration> closedRegistrations = registrationRepository.findByEventIdAndStatus(eventClosed.getId(), RegistrationStatus.ACTIVE);
        for (int i = 0; i < Math.min(2, closedRegistrations.size()); i++) {
            saveCheckIn(closedRegistrations.get(i), organizer, CheckInStatus.SUCCESS);
        }

        // In sẵn số liệu để trước khi lên demo chỉ cần nhìn console là biết dữ liệu đã đúng chưa,
        // không phải mở từng trang ra đếm.
        System.out.println("DemoSeeder: đã tạo dữ liệu demo sạch — "
                + "3 loại sự kiện · 4 sự kiện (OPEN / CLOSED / CANCELLED / kín chỗ) · "
                + "12 tài khoản (demo_admin, demo_organizer, participant_1..10) · "
                + (registrations.size()) + " lượt đăng ký · 6 lượt điểm danh.");
    }

    private Role ensureRole(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));
    }

    private EventCategory ensureCategory(String categoryName) {
        return categoryRepository.findByNameIgnoreCase(categoryName)
                .orElseGet(() -> categoryRepository.save(EventCategory.builder()
                        .name(categoryName)
                        .description("Danh mục demo cho trình diễn cuối kỳ.")
                        .build()));
    }

    private Registration createRegistration(Event event, User user, RegistrationStatus status) {
        Registration registration = new Registration();
        registration.setEvent(event);
        registration.setUser(user);
        registration.setStatus(status);
        registration.setCode(generateCode());
        registration.setRegisteredAt(LocalDateTime.now().minusDays(1));
        return registration;
    }

    private void saveCheckIn(Registration registration, User checkedBy, CheckInStatus status) {
        if (checkInHistoryRepository.existsByRegistrationId(registration.getId())) {
            return;
        }

        var history = new com.qlskdd.entity.CheckInHistory();
        history.setRegistration(registration);
        history.setCheckedBy(checkedBy);
        history.setStatus(status);
        checkInHistoryRepository.save(history);
    }

    private String generateCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }
}
