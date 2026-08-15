import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../components/common/Toast';
import { clearCredentials, setCredentials } from '../../../stores/slices/authSlice';
import { store } from '../../../stores/store';
import EventDetailPage from './EventDetailPage';

// Ngày tương đối so với lúc test chạy — tránh lặp lại lỗi hardcode ngày cố định
// (vd '2026-08-10') khiến test tự "hết hạn" và fail sai khi đồng hồ hệ thống vượt qua mốc đó.
const futureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const mocks = vi.hoisted(() => ({
  getEventByIdMock: vi.fn(),
  registerForEventMock: vi.fn(),
  getRegistrationQrMock: vi.fn(),
  getAttendanceSummaryMock: vi.fn(),
}));

vi.mock('../eventsApi', () => ({
  getEventById: mocks.getEventByIdMock,
  changeEventStatus: vi.fn(),
}));

vi.mock('../../registrations/registrationsApi', () => ({
  registerForEvent: mocks.registerForEventMock,
  getRegistrationQr: mocks.getRegistrationQrMock,
}));

vi.mock('../../checkin/checkinApi', () => ({
  getAttendanceSummary: mocks.getAttendanceSummaryMock,
}));

describe('EventDetailPage registration', () => {
  beforeEach(() => {
    store.dispatch(clearCredentials());
    mocks.getEventByIdMock.mockReset();
    mocks.registerForEventMock.mockReset();
    mocks.getRegistrationQrMock.mockReset();
    mocks.getAttendanceSummaryMock.mockReset();
    mocks.getRegistrationQrMock.mockResolvedValue(new Blob(['qr'], { type: 'image/png' }));
  });

  it('registers successfully and updates the button label', async () => {
    store.dispatch(
      setCredentials({
        user: {
          id: 1,
          username: 'user01',
          fullName: 'Người dùng',
          email: 'user@example.com',
          role: 'ROLE_USER',
        },
        token: 'token',
      }),
    );

    const baseEvent = {
      id: 1,
      name: 'Sự kiện thử',
      description: 'Mô tả',
      location: 'Đà Nẵng',
      capacity: 10,
      // Ngày tương đối so với lúc test chạy (không hardcode) — sự kiện phải luôn ở
      // tương lai để nút "Đăng ký tham gia" không bị khoá bởi điều kiện "đã diễn ra".
      startAt: futureDate(2).toISOString(),
      endAt: futureDate(4).toISOString(),
      status: 'OPEN' as const,
      categoryId: 1,
      categoryName: 'Hội thảo',
      createdBy: 'organizer',
      createdAt: new Date().toISOString(),
      totalRegistered: 2,
      availableSeats: 8,
      attendanceRate: 0,
    };
    // Lần tải đầu: chưa đăng ký. Sau khi đăng ký thành công, trang gọi lại getEventById
    // (để cập nhật availableSeats) — backend thật lúc đó đã trả registered=true, nên mock
    // ở lần gọi thứ 2 phải phản ánh đúng, tránh "clobber" giá trị optimistic set trước đó.
    mocks.getEventByIdMock
      .mockResolvedValueOnce({ ...baseEvent, registered: false })
      .mockResolvedValue({ ...baseEvent, registered: true, totalRegistered: 3, availableSeats: 7 });

    mocks.registerForEventMock.mockResolvedValue({
      registrationId: 55,
      code: 'EVT12345',
      eventName: 'Sự kiện thử',
    });

    render(
      <Provider store={store}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/events/1']}>
            <Routes>
              <Route path="/events/:id" element={<EventDetailPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </Provider>,
    );

    expect(await screen.findByRole('button', { name: 'Đăng ký tham gia' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký tham gia' }));

    await waitFor(() => expect(mocks.registerForEventMock).toHaveBeenCalledWith(1));
    expect(await screen.findByText('Đã đăng ký')).toBeInTheDocument();
    expect(screen.getAllByText(/Đăng ký thành công/).length).toBeGreaterThan(0);
    expect(screen.getByRole('dialog', { name: 'Vé tham dự của bạn' })).toBeInTheDocument();
  });

  it('hiển thị "Đã đăng ký" ngay khi tải trang nếu API báo đã đăng ký từ trước, không cần bấm mới biết', async () => {
    store.dispatch(
      setCredentials({
        user: {
          id: 1,
          username: 'user01',
          fullName: 'Người dùng',
          email: 'user@example.com',
          role: 'ROLE_USER',
        },
        token: 'token',
      }),
    );

    mocks.getEventByIdMock.mockResolvedValue({
      id: 1,
      name: 'Sự kiện thử',
      description: 'Mô tả',
      location: 'Đà Nẵng',
      capacity: 10,
      startAt: futureDate(2).toISOString(),
      endAt: futureDate(4).toISOString(),
      status: 'OPEN',
      categoryId: 1,
      categoryName: 'Hội thảo',
      createdBy: 'organizer',
      createdAt: new Date().toISOString(),
      totalRegistered: 2,
      availableSeats: 8,
      attendanceRate: 0,
      registered: true,
    });

    render(
      <Provider store={store}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/events/1']}>
            <Routes>
              <Route path="/events/:id" element={<EventDetailPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </Provider>,
    );

    const button = await screen.findByRole('button', { name: 'Đã đăng ký' });
    expect(button).toBeDisabled();
    expect(screen.getByText('Bạn đã đăng ký sự kiện này')).toBeInTheDocument();
    expect(mocks.registerForEventMock).not.toHaveBeenCalled();
  });

  it('hiển thị biểu đồ tổng hợp có mặt / vắng cho ORGANIZER', async () => {
    store.dispatch(
      setCredentials({
        user: {
          id: 2,
          username: 'organizer',
          fullName: 'Ban tổ chức',
          email: 'organizer@example.com',
          role: 'ROLE_ORGANIZER',
        },
        token: 'token',
      }),
    );

    mocks.getEventByIdMock.mockResolvedValue({
      id: 1,
      name: 'Sự kiện thử',
      description: 'Mô tả',
      location: 'Đà Nẵng',
      capacity: 10,
      startAt: futureDate(2).toISOString(),
      endAt: futureDate(4).toISOString(),
      status: 'OPEN',
      categoryId: 1,
      categoryName: 'Hội thảo',
      createdBy: 'organizer',
      createdAt: new Date().toISOString(),
      totalRegistered: 2,
      availableSeats: 8,
      attendanceRate: 50,
      registered: false,
    });

    mocks.getAttendanceSummaryMock.mockResolvedValue({
      summary: { totalRegistered: 2, present: 1, absent: 1, attendanceRate: 50 },
      present: [],
      absent: [],
    });

    render(
      <Provider store={store}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/events/1']}>
            <Routes>
              <Route path="/events/:id" element={<EventDetailPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </Provider>,
    );

    expect(await screen.findByText('Tổng hợp có mặt / vắng')).toBeInTheDocument();
    expect(mocks.getAttendanceSummaryMock).toHaveBeenCalledWith(1);
    expect(screen.getByRole('img', { name: 'Biểu đồ tổng hợp điểm danh: có mặt 1, vắng 1' })).toBeInTheDocument();
  });
});
