import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../stores/store';
import { clearCredentials } from '../stores/slices/authSlice';
import { useToast } from '../components/common/Toast';
import { ROUTES } from '../constants/routes';
import { SESSION_EXPIRED_EVENT } from '../constants/events';

/**
 * Lắng nghe sự kiện phiên hết hạn do apiClient phát ra khi bắt được lỗi 401
 * (interceptor không thể tự dispatch redux/toast/navigate vì nó không phải React).
 * Gọi hook này một lần duy nhất ở App root (B1.2-T6).
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(clearCredentials());
      showToast('Phiên đăng nhập đã hết hạn', 'error');
      navigate(ROUTES.LOGIN, { replace: true });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [dispatch, navigate, showToast]);
}
