import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../components/common/Toast';
import authReducer, { setCredentials } from '../../../stores/slices/authSlice';
import { changePassword, logout as logoutApi } from '../authApi';
import ChangePasswordPage from './ChangePasswordPage';

vi.mock('../authApi', () => ({
  login: vi.fn(),
  getMe: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
}));

const mockedChangePassword = vi.mocked(changePassword);
const mockedLogoutApi = vi.mocked(logoutApi);

function renderPage() {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(setCredentials({
    token: 'valid-jwt-token',
    user: {
      id: 3,
      username: 'user1',
      fullName: 'Người dùng 1',
      email: 'user1@example.com',
      role: 'ROLE_USER',
    },
  }));

  render(
    <Provider store={store}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/change-password']}>
          <Routes>
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/login" element={<h1>Trang đăng nhập</h1>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </Provider>,
  );

  return store;
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Mật khẩu hiện tại/), 'matKhauCu123');
  await user.type(screen.getByLabelText(/^Mật khẩu mới/), 'matKhauMoi123');
  await user.type(screen.getByLabelText(/^Xác nhận mật khẩu mới/), 'matKhauMoi123');
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    mockedLogoutApi.mockResolvedValue(undefined);
  });

  it('hiển thị đủ 3 ô mật khẩu và cập nhật thanh đo độ mạnh', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByLabelText(/^Mật khẩu hiện tại/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu mới/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Xác nhận mật khẩu mới/)).toBeInTheDocument();

    const strengthBar = screen.getByRole('progressbar', { name: 'Độ mạnh mật khẩu' });
    expect(strengthBar).toHaveAttribute('aria-valuenow', '0');

    await user.type(screen.getByLabelText(/^Mật khẩu mới/), 'MatKhauMoi123!');

    expect(strengthBar).toHaveAttribute('aria-valuenow', '4');
    expect(screen.getByText('Mạnh')).toBeInTheDocument();
  });

  it('không gọi API khi xác nhận mật khẩu mới không khớp', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^Mật khẩu hiện tại/), 'matKhauCu123');
    await user.type(screen.getByLabelText(/^Mật khẩu mới/), 'matKhauMoi123');
    await user.type(screen.getByLabelText(/^Xác nhận mật khẩu mới/), 'khongKhop123');
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    expect(screen.getByText('Xác nhận mật khẩu không khớp với mật khẩu mới')).toBeInTheDocument();
    expect(mockedChangePassword).not.toHaveBeenCalled();
  });

  it('ánh xạ lỗi validation từ backend vào đúng ô nhập', async () => {
    const user = userEvent.setup();
    mockedChangePassword.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          message: 'Dữ liệu không hợp lệ',
          errors: [{ field: 'newPassword', message: 'Mật khẩu mới không hợp lệ' }],
        },
      },
    });
    renderPage();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    expect(await screen.findByText('Mật khẩu mới không hợp lệ')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu mới/)).toHaveAttribute('aria-invalid', 'true');
    expect(mockedLogoutApi).not.toHaveBeenCalled();
  });

  it('hiển thị alert chung khi mật khẩu hiện tại không đúng', async () => {
    const user = userEvent.setup();
    mockedChangePassword.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: 'Mật khẩu hiện tại không đúng' },
      },
    });
    renderPage();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu hiện tại không đúng');
    expect(screen.getByLabelText(/^Mật khẩu hiện tại/)).toHaveAttribute('aria-invalid', 'false');
    expect(mockedLogoutApi).not.toHaveBeenCalled();
  });

  it('dùng message backend, xoá phiên và chuyển về đăng nhập khi đổi thành công', async () => {
    const user = userEvent.setup();
    const successMessage = 'Đổi mật khẩu thành công, vui lòng đăng nhập lại';
    mockedChangePassword.mockResolvedValueOnce(successMessage);
    mockedLogoutApi.mockImplementationOnce(() => new Promise<void>(() => undefined));
    const store = renderPage();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    expect(mockedChangePassword).toHaveBeenCalledWith({
      oldPassword: 'matKhauCu123',
      newPassword: 'matKhauMoi123',
      confirmPassword: 'matKhauMoi123',
    });
    expect(await screen.findByRole('heading', { name: 'Trang đăng nhập' })).toBeInTheDocument();
    expect(screen.getByText(successMessage)).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
    await waitFor(() => expect(store.getState().auth.isLoggedIn).toBe(false));
    expect(mockedLogoutApi).toHaveBeenCalledOnce();
  });
});
