// Khớp với BaseRes<T> phía backend (com.qlskdd.mapper.response.BaseRes)
export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface Role {
  id?: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string | null;
  // "preset:<màu>" hoặc data URI ảnh — xem components/ui/Avatar
  avatar?: string | null;
}

/** Các trường người dùng tự sửa được; username/email/role cố ý nằm ngoài (xem ProfileReq ở backend) */
export interface ProfileRequest {
  fullName: string;
  phone: string;
  avatar: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
