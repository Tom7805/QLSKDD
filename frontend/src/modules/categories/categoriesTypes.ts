import type { ApiResponse } from '../auth/authTypes';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  eventCount: number;
}

export interface CategoryRequest {
  name: string;
  description?: string | null;
}

export type CategoriesApiResponse = ApiResponse<Category[]>;
export type CategoryApiResponse = ApiResponse<Category>;
