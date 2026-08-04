package com.qlskdd.service;

import com.qlskdd.dto.request.CategoryReq;
import com.qlskdd.mapper.response.CategoryRes;

import java.util.List;

public interface CategoryService {

    List<CategoryRes> getAll();

    CategoryRes getById(Long id);

    CategoryRes create(CategoryReq req);

    CategoryRes update(Long id, CategoryReq req);

    void delete(Long id);
}
