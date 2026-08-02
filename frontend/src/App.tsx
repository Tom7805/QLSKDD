import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './stores/store';
import { restoreSession, selectIsLoggedIn, selectUser } from './stores/slices/authSlice';

function App() {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const user = useAppSelector(selectUser);

  // Khi app khởi động: nếu đã có token lưu sẵn thì gọi /auth/me để khôi phục phiên
  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      dispatch(restoreSession());
    }
  }, [dispatch]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <h1 className="text-2xl font-semibold text-slate-800">
        QLSK_DD Frontend{isLoggedIn && user ? ` — Xin chào, ${user.fullName}` : ''}
      </h1>
    </div>
  );
}

export default App;
