import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../../../stores/slices/authSlice';
import { login } from '../authApi';
import LoginForm from './LoginForm';

vi.mock('../authApi', () => ({
  login: vi.fn(),
  getMe: vi.fn(),
}));

const mockedLogin = vi.mocked(login);

function renderLoginForm() {
  const store = configureStore({ reducer: { auth: authReducer } });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<h1>Trang chính</h1>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

  return store;
}

describe('LoginForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hiện thông báo bắt buộc và không gọi API khi submit form trống', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(screen.getByText('Tên đăng nhập là bắt buộc')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu là bắt buộc')).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it('hiện alert khi API trả về 401', async () => {
    const user = userEvent.setup();
    mockedLogin.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Sai tài khoản hoặc mật khẩu' } },
    });
    renderLoginForm();

    await user.type(screen.getByLabelText('Tên đăng nhập'), 'admin');
    await user.type(screen.getByLabelText('Mật khẩu'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Sai tài khoản hoặc mật khẩu')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('lưu token và điều hướng sang trang chính khi API trả về 200', async () => {
    const user = userEvent.setup();
    mockedLogin.mockResolvedValueOnce({
      accessToken: 'valid-jwt-token',
      tokenType: 'Bearer',
      user: {
        id: 1,
        username: 'admin',
        fullName: 'Quản trị viên',
        email: 'admin@example.com',
        role: 'ROLE_ADMIN',
      },
    });
    const store = renderLoginForm();

    await user.type(screen.getByLabelText('Tên đăng nhập'), 'admin');
    await user.type(screen.getByLabelText('Mật khẩu'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('heading', { name: 'Trang chính' })).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBe('valid-jwt-token');
    await waitFor(() => expect(store.getState().auth.isLoggedIn).toBe(true));
  });
});

