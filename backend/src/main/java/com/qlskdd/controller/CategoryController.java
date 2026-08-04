package com.qlskdd.controller;

import com.qlskdd.dto.request.CategoryReq;
import com.qlskdd.mapper.response.BaseRes;
import com.qlskdd.mapper.response.CategoryRes;
import com.qlskdd.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// GET permitAll đã cấu hình sẵn ở SecurityConfig ("/api/v1/categories/**"); các thao
// tác ghi dưới đây tự giới hạn ADMIN bằng @PreAuthorize (B2.1-T4).
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<BaseRes<List<CategoryRes>>> getAll() {
        List<CategoryRes> result = categoryService.getAll();
        return ResponseEntity.ok(BaseRes.success("Lấy danh sách loại sự kiện thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseRes<CategoryRes>> getById(@PathVariable Long id) {
        CategoryRes result = categoryService.getById(id);
        return ResponseEntity.ok(BaseRes.success("Lấy loại sự kiện thành công", result));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseRes<CategoryRes>> create(@Valid @RequestBody CategoryReq req) {
        CategoryRes created = categoryService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseRes.of(HttpStatus.CREATED.value(), "Tạo loại sự kiện thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseRes<CategoryRes>> update(@PathVariable Long id, @Valid @RequestBody CategoryReq req) {
        CategoryRes updated = categoryService.update(id, req);
        return ResponseEntity.ok(BaseRes.success("Cập nhật loại sự kiện thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseRes<Void>> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(BaseRes.success("Xoá loại sự kiện thành công", null));
    }
}
