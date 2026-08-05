import apiClient from '../../configs/apiClient';
import type { Category, CategoryRequest, CategoriesApiResponse, CategoryApiResponse } from './categoriesTypes';

const CATEGORIES_BASE_URL = '/categories';

export const getCategories = (): Promise<Category[]> =>
  apiClient.get<CategoriesApiResponse>(CATEGORIES_BASE_URL).then((response) => response.data.data);

export const createCategory = (request: CategoryRequest): Promise<Category> =>
  apiClient.post<CategoryApiResponse>(CATEGORIES_BASE_URL, request).then((response) => response.data.data);

export const updateCategory = (id: number, request: CategoryRequest): Promise<Category> =>
  apiClient.put<CategoryApiResponse>(`${CATEGORIES_BASE_URL}/${id}`, request).then((response) => response.data.data);

export const deleteCategory = (id: number): Promise<void> =>
  apiClient.delete<CategoryApiResponse>(`${CATEGORIES_BASE_URL}/${id}`).then(() => undefined);
