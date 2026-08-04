import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../stores/store';
import { logout, selectUser } from '../../stores/slices/authSlice';
import { useToast } from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';
import { ROUTES } from '../../constants/routes';
import { ROLE_LABELS } from '../../constants/roles';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = useAppSelector(selectUser);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) return null;

  const handleConfirmLogout = async () => {
    setConfirmOpen(false);
    await dispatch(logout());
    showToast('Đã đăng xuất', 'success');
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <span className="text-lg font-bold text-slate-900">QLSK_DD</span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block font-medium leading-tight text-slate-800">{user.fullName}</span>
              <span className="block text-xs leading-tight text-slate-500">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </span>
          </button>

          {menuOpen && (
            <>
              {/* Lớp phủ để bấm ra ngoài là đóng menu */}
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-medium text-slate-800">{user.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>

                <button
                  type="button"
                  disabled
                  title="Tính năng đang phát triển"
                  className="block w-full cursor-not-allowed px-4 py-2 text-left text-sm text-slate-400"
                >
                  Thông tin cá nhân
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(ROUTES.CHANGE_PASSWORD);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Đổi mật khẩu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất?"
        confirmLabel="Đăng xuất"
        cancelLabel="Huỷ"
        onConfirm={handleConfirmLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </header>
  );
}
