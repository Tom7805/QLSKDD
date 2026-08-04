import { Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';
import { ROUTES } from '../constants/routes';

export interface RoleRouteProps {
  allow: string[];
  children?: ReactNode;
}

// Chặn route theo vai trò — dùng bên trong <PrivateRoute> (đã đảm bảo đăng nhập rồi),
// chỉ còn kiểm tra vai trò có nằm trong danh sách allow hay không.
// Ví dụ: <Route element={<RoleRoute allow={['ROLE_ADMIN']} />}>...
export default function RoleRoute({ allow, children }: RoleRouteProps) {
  const allowed = usePermission(allow);

  if (!allowed) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  return children ?? <Outlet />;
}
