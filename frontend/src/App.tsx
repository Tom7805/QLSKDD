import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './stores/store';
import { restoreSession, selectIsLoggedIn, selectUser } from './stores/slices/authSlice';
import LoginPage from './modules/auth/pages/LoginPage';
import { ROUTES } from './constants/routes';
import PrivateRoute from './routers/PrivateRoute';
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

function App() {
  const dispatch = useAppDispatch();

  // Kích hoạt lắng nghe sự kiện phiên hết hạn (B1.2-T6) — chỉ cần gọi 1 lần ở root
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
        </Route>
      </Route>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
    </Routes>
  );
}

export default App;
