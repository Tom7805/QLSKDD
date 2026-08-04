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
