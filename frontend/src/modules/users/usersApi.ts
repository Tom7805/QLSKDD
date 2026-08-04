import apiClient from '../../configs/apiClient';
import type {
  GetUsersParams,
  PageResponse,
  User,
  UserApiResponse,
  UserRequest,
  UsersPageApiResponse,
} from './usersTypes';

const USERS_BASE_URL = '/users';

/** Lấy danh sách tài khoản, hỗ trợ tìm kiếm và phân trang (page bắt đầu từ 0). */
export const getUsers = (params: GetUsersParams = {}): Promise<PageResponse<User>> =>
  apiClient
    .get<UsersPageApiResponse>(USERS_BASE_URL, { params })
    .then((response) => response.data.data);

/** Tạo tài khoản mới. Backend yêu cầu password có ít nhất 8 ký tự. */
export const createUser = (request: UserRequest): Promise<User> =>
  apiClient
    .post<UserApiResponse>(USERS_BASE_URL, request)
    .then((response) => response.data.data);

/** Cập nhật tài khoản. Bỏ password hoặc để undefined để giữ mật khẩu hiện tại. */
export const updateUser = (id: number, request: UserRequest): Promise<User> =>
  apiClient
    .put<UserApiResponse>(`${USERS_BASE_URL}/${id}`, request)
    .then((response) => response.data.data);

/** Khoá hoặc mở khoá tài khoản theo trạng thái hiện tại ở backend. */
export const toggleStatus = (id: number): Promise<User> =>
  apiClient
    .patch<UserApiResponse>(`${USERS_BASE_URL}/${id}/status`)
    .then((response) => response.data.data);
