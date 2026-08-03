import axios from 'axios';
import { SESSION_EXPIRED_EVENT } from '../constants/events';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự gắn header Authorization nếu đã có token trong localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gặp 401 (token hết hạn/không hợp lệ) → xoá token và phát sự kiện để useAuth xử lý
// đăng xuất + điều hướng + toast (không tự điều hướng ở đây vì apiClient không phải
// React component, không dùng được react-router/redux/toast trực tiếp).
// Bỏ qua chính các endpoint auth (login/logout) vì 401 ở đó là do sai thông tin đăng
// nhập bình thường, không phải phiên bị hết hạn.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/logout');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
