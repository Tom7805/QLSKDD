import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../stores/store';
import {
  selectAuthLoading,
  selectIsLoggedIn,
} from '../stores/slices/authSlice';
import { ROUTES } from '../constants/routes';

export interface PrivateRouteProps {
  children?: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const isLoading = useAppSelector(selectAuthLoading);
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600"
        role="status"
      >
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
