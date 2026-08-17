// Tên sự kiện DOM dùng để giao tiếp giữa apiClient (interceptor, không phải React)
// và các hook/component React (useAuth) mà không tạo import vòng (apiClient <-> store).
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';
export const FORBIDDEN_EVENT = 'auth:forbidden';
