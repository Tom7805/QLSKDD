import apiClient from '../../configs/apiClient';
import type { ApiResponse, LoginRequest, LoginResponse, User } from './authTypes';

const AUTH_BASE_URL = '/auth';

export const login = (req: LoginRequest): Promise<LoginResponse> =>
  apiClient
    .post<ApiResponse<LoginResponse>>(`${AUTH_BASE_URL}/login`, req)
    .then((res) => res.data.data);

export const getMe = (): Promise<User> =>
  apiClient
    .get<ApiResponse<User>>(`${AUTH_BASE_URL}/me`)
    .then((res) => res.data.data);

export const logout = (): Promise<void> =>
  apiClient.post<ApiResponse<void>>(`${AUTH_BASE_URL}/logout`).then(() => undefined);
