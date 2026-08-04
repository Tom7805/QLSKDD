import type { ApiResponse } from '../auth/authTypes';

/** Tài khoản trả về từ UserRes phía backend. */
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  enabled: boolean;
  createdAt: string;
}

/** Dữ liệu gửi lên khi tạo hoặc cập nhật tài khoản. */
export interface UserRequest {
  username: string;
  fullName: string;
  email: string;
  phone?: string | null;
  roleId: number;
  password?: string;
}

/** Tham số lọc và phân trang của GET /users. */
export interface GetUsersParams {
  keyword?: string;
  page?: number;
  size?: number;
}

/** Khớp với PageRes<T> phía backend. */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type UserApiResponse = ApiResponse<User>;
export type UsersPageApiResponse = ApiResponse<PageResponse<User>>;
