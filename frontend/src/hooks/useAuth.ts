import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../stores/store';
import { clearCredentials } from '../stores/slices/authSlice';
import { useToast } from '../components/common/Toast';
import { ROUTES } from '../constants/routes';
import { FORBIDDEN_EVENT, SESSION_EXPIRED_EVENT } from '../constants/events';

/**
 * Lắng nghe các sự kiện do apiClient phát ra khi bắt được lỗi 401/403
 * (interceptor không thể tự dispatch redux/toast/navigate vì nó không phải React).
 * Gọi hook này một lần duy nhất ở App root (B1.2-T6, B1.3-T8).
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

    // 403: chỉ báo toast, không đăng xuất/điều hướng — khác hẳn 401
    const handleForbidden = () => {
      showToast('Bạn không có quyền thực hiện thao tác này', 'error');
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    window.addEventListener(FORBIDDEN_EVENT, handleForbidden);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
      window.removeEventListener(FORBIDDEN_EVENT, handleForbidden);
    };
  }, [dispatch, navigate, showToast]);
}
