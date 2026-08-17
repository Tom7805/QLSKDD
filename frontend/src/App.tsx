import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAppDispatch } from './stores/store';
import { restoreSession } from './stores/slices/authSlice';
import LoginPage from './modules/auth/pages/LoginPage';
import ForbiddenPage from './modules/auth/pages/ForbiddenPage';
import CategoryListPage from './modules/categories/pages/CategoryListPage';
import EventFormPage from './modules/events/pages/EventFormPage';
import EventDetailPage from './modules/events/pages/EventDetailPage';
import EventListPage from './modules/events/pages/EventListPage';
import { ROUTES } from './constants/routes';
import PrivateRoute from './routers/PrivateRoute';
import RoleRoute from './routers/RoleRoute';
import MainLayout from './layouts/MainLayout';
import { useAuth } from './hooks/useAuth';
import UserListPage from './modules/users/pages/UserListPage';
import ChangePasswordPage from './modules/auth/pages/ChangePasswordPage';
import MyRegistrationsPage from './modules/registrations/pages/MyRegistrationsPage';
import EventRegistrationsPage from './modules/events/pages/EventRegistrationsPage';
import ParticipantListPage from './modules/registrations/pages/ParticipantListPage';
import CheckInPage from './modules/checkin/pages/CheckInPage';
import AttendancePage from './modules/checkin/pages/AttendancePage';
import DashboardPage from './modules/dashboard/pages/DashboardPage';
import HomePage from './modules/home/pages/HomePage';
import ProfilePage from './modules/auth/pages/ProfilePage';

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
          <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.EVENTS} element={<EventListPage />} />
          <Route path={ROUTES.MY_REGISTRATIONS} element={<MyRegistrationsPage />} />
          <Route path={ROUTES.EVENT_DETAIL} element={<EventDetailPage />} />
          <Route element={<RoleRoute allow={['ROLE_ADMIN', 'ROLE_ORGANIZER']} />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.EVENT_CREATE} element={<EventFormPage />} />
            <Route path={ROUTES.EVENT_EDIT} element={<EventFormPage />} />
            <Route path={ROUTES.EVENT_REGISTRATIONS} element={<EventRegistrationsPage />} />
            <Route path={ROUTES.EVENT_CHECK_IN} element={<CheckInPage />} />
            <Route path={ROUTES.EVENT_ATTENDANCE} element={<AttendancePage />} />
            <Route path={ROUTES.PARTICIPANTS} element={<ParticipantListPage />} />
          </Route>
          <Route element={<RoleRoute allow={['ROLE_ADMIN']} />}>
            <Route path={ROUTES.USERS} element={<UserListPage />} />
            <Route path={ROUTES.CATEGORIES} element={<CategoryListPage />} />
          </Route>
        </Route>
      </Route>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
    </Routes>
  );
}

export default App;
