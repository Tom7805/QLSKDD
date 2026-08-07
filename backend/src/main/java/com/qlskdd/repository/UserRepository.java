package com.qlskdd.repository;

import com.qlskdd.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // B1.4-T1: tìm kiếm tài khoản theo username hoặc họ tên (không phân biệt hoa thường)
    Page<User> findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(
            String username, String fullName, Pageable pageable);

    // B1.4-T3: chặn trùng username/email khi sửa, bỏ qua chính bản ghi đang sửa
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);

    // B3.4-T1: danh sách người tham gia = user có vai trò roleName, tìm theo họ tên/email
    // (keyword rỗng "" khớp mọi bản ghi nhờ LIKE '%%')
    @Query("SELECT u FROM User u WHERE u.role.name = :roleName AND "
            + "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findByRoleNameAndKeyword(@Param("roleName") String roleName,
                                          @Param("keyword") String keyword, Pageable pageable);
}