import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../components/common/Toast';
import authReducer, { setCredentials } from '../../../stores/slices/authSlice';
import * as authApi from '../authApi';
import type { User } from '../authTypes';
import ProfilePage from './ProfilePage';

vi.mock('../authApi');

const mockedUpdateProfile = vi.mocked(authApi.updateProfile);

const baseUser: User = {
  id: 1,
  username: 'organizer1',
  fullName: 'Trần Thị B',
  email: 'b@example.com',
  role: 'ROLE_ORGANIZER',
  phone: '0900123456',
  avatar: 'preset:violet',
};

function renderProfile(overrides: Partial<User> = {}) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(setCredentials({ user: { ...baseUser, ...overrides }, token: 'token' }));
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <ToastProvider>
          <ProfilePage />
        </ToastProvider>
      </MemoryRouter>
    </Provider>,
  );
  return { ...view, store };
}

beforeEach(() => {
  vi.resetAllMocks();
  // Thứ tự thẻ cột phải được nhớ trong localStorage — dọn để mỗi test bắt đầu như nhau
  localStorage.clear();
});

describe('ProfilePage', () => {
  /**
   * Kéo thả bằng chuột không ai dùng được bằng bàn phím, mà đây lại là cách duy nhất để
   * sắp lại bố cục — nên tay cầm phải nhận cả phím mũi tên.
   */
  it('đổi vị trí thẻ ở cột phải bằng phím mũi tên và ghi nhớ thứ tự mới', () => {
    renderProfile();

    const cards = screen.getByRole('list', { name: 'Thẻ thông tin tài khoản' });
    expect(within(cards).getAllByRole('listitem')[0]).toHaveTextContent('Trần Thị B');

    fireEvent.keyDown(screen.getByRole('button', { name: /Đổi vị trí thẻ Tài khoản/ }), { key: 'ArrowDown' });

    expect(within(cards).getAllByRole('listitem')[0]).toHaveTextContent('Quyền của bạn');
    expect(JSON.parse(localStorage.getItem('qlskdd.profile.cardOrder') ?? '[]')[0]).toBe('capabilities');
  });

  it('nạp sẵn thông tin hiện tại vào form', () => {
    renderProfile();

    expect(screen.getByDisplayValue('Trần Thị B')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0900123456')).toBeInTheDocument();
  });

  /** Ba trường này backend cố ý không cho tự sửa — giao diện phải phản ánh đúng */
  it('khoá tên đăng nhập và email, nêu rõ lý do', () => {
    renderProfile();

    expect(screen.getByDisplayValue('organizer1')).toBeDisabled();
    expect(screen.getByDisplayValue('b@example.com')).toBeDisabled();
    expect(screen.getByText('Không đổi được — dùng để đăng nhập')).toBeInTheDocument();
  });

  it('vô hiệu hoá nút lưu khi chưa sửa gì và bật lên khi có thay đổi', () => {
    renderProfile();

    const save = screen.getByRole('button', { name: 'Lưu thay đổi' });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByDisplayValue('Trần Thị B'), { target: { value: 'Tên Mới' } });
    expect(save).toBeEnabled();
  });

  it('lưu hồ sơ và cập nhật ngay vào store để sidebar đổi theo', async () => {
    const updated: User = { ...baseUser, fullName: 'Tên Mới', avatar: 'preset:sky' };
    mockedUpdateProfile.mockResolvedValue(updated);

    const { store } = renderProfile();
    fireEvent.change(screen.getByDisplayValue('Trần Thị B'), { target: { value: 'Tên Mới' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() =>
      expect(mockedUpdateProfile).toHaveBeenCalledWith({
        fullName: 'Tên Mới',
        phone: '0900123456',
        avatar: 'preset:violet',
      }),
    );
    await waitFor(() => expect(store.getState().auth.user?.fullName).toBe('Tên Mới'));
  });

  it('không gọi API khi số điện thoại sai định dạng', async () => {
    renderProfile();

    fireEvent.change(screen.getByDisplayValue('0900123456'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('Số điện thoại không hợp lệ')).toBeInTheDocument();
    expect(mockedUpdateProfile).not.toHaveBeenCalled();
  });

  it('đổi màu avatar bằng bộ chọn và hoàn tác được về giá trị cũ', () => {
    renderProfile();

    const presets = screen.getByRole('group', { name: 'Chọn màu ảnh đại diện' });
    const skyButton = presets.querySelectorAll('button')[2] as HTMLButtonElement;
    fireEvent.click(skyButton);

    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác' }));
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
  });

  /** Nội dung cột phải đổi theo vai trò — người dùng thường không có quyền quản trị */
  it('liệt kê quyền đúng theo vai trò', () => {
    const { unmount } = renderProfile({ role: 'ROLE_USER' });
    expect(screen.getByText('Đăng ký và huỷ đăng ký tham gia')).toBeInTheDocument();
    expect(screen.queryByText('Quản lý toàn bộ tài khoản người dùng')).not.toBeInTheDocument();
    unmount();

    renderProfile({ role: 'ROLE_ADMIN' });
    expect(screen.getByText('Quản lý toàn bộ tài khoản người dùng')).toBeInTheDocument();
  });
});
