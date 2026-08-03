import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './stores/store';
import { restoreSession, selectIsLoggedIn, selectUser } from './stores/slices/authSlice';
import LoginPage from './modules/auth/pages/LoginPage';
import ForbiddenPage from './modules/auth/pages/ForbiddenPage';
import { ROUTES } from './constants/routes';
import PrivateRoute from './routers/PrivateRoute';
import RoleRoute from './routers/RoleRoute';
import MainLayout from './layouts/MainLayout';
import { useAuth } from './hooks/useAuth';

function HomePage() {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const user = useAppSelector(selectUser);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
      <h1 className="text-2xl font-semibold text-slate-800">
        QLSK_DD Frontend{isLoggedIn && user ? ` — Xin chào, ${user.fullName}` : ''}
      </h1>
    </div>
  );
}

// Placeholder tạm cho tới khi UserListPage (B1.4) được triển khai thật —
// chỉ để RoleRoute có 1 route thật để bảo vệ và kiểm chứng được (B1.3-T6).
function UsersPlaceholderPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
      <h1 className="text-2xl font-semibold text-slate-800">Quản lý người dùng (ROLE_ADMIN)</h1>
    </div>
  );
}

function App() {
  const dispatch = useAppDispatch();

  // Kích hoạt lắng nghe sự kiện phiên hết hạn/không đủ quyền (B1.2-T6, B1.3-T8)
  useAuth();

  // Khi app khởi động: nếu đã có token lưu sẵn thì gọi /auth/me để khôi phục phiên
  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      dispatch(restoreSession());
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route element={<RoleRoute allow={['ROLE_ADMIN']} />}>
            <Route path={ROUTES.USERS} element={<UsersPlaceholderPage />} />
          </Route>
        </Route>
      </Route>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
    </Routes>
  );
}

export default App;
