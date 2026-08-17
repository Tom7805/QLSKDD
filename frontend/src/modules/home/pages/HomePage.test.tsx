import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer, { setCredentials } from '../../../stores/slices/authSlice';
import type { User } from '../../auth/authTypes';
import * as dashboardApi from '../../dashboard/dashboardApi';
import * as eventsApi from '../../events/eventsApi';
import type { EventsPage, EventSummary } from '../../events/eventsTypes';
import * as registrationsApi from '../../registrations/registrationsApi';
import type { RegistrationsPage } from '../../registrations/registrationsTypes';
import HomePage from './HomePage';

vi.mock('../../events/eventsApi');
vi.mock('../../registrations/registrationsApi');
vi.mock('../../dashboard/dashboardApi');

const mockedGetEvents = vi.mocked(eventsApi.getEvents);
const mockedGetMyRegistrations = vi.mocked(registrationsApi.getMyRegistrations);
const mockedGetDashboardSummary = vi.mocked(dashboardApi.getDashboardSummary);

const NOW = new Date('2026-08-15T10:00:00');

function makeEvent(overrides: Partial<EventSummary> & Pick<EventSummary, 'id' | 'name' | 'startAt' | 'endAt'>): EventSummary {
  return {
    location: 'Đà Nẵng',
    status: 'OPEN',
    capacity: 30,
    availableSeats: 12,
    attendanceRate: 0,
    categoryId: 1,
    categoryName: 'Hội thảo',
    ...overrides,
  };
}

const eventsPage = (content: EventSummary[]): EventsPage => ({
  content, page: 0, size: 100, totalElements: content.length, totalPages: 1, last: true,
});

const emptyRegistrations: RegistrationsPage = {
  content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true,
};

function renderHome(role: string) {
  const store = configureStore({ reducer: { auth: authReducer } });
  const user: User = { id: 1, username: 'u', fullName: 'Nguyễn Văn A', email: 'a@example.com', role };
  store.dispatch(setCredentials({ user, token: 'token' }));
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  vi.resetAllMocks();
  // Thứ tự khối được nhớ trong localStorage — dọn để mỗi test bắt đầu từ bố cục mặc định
  localStorage.clear();
  mockedGetEvents.mockResolvedValue(eventsPage([]));
  mockedGetMyRegistrations.mockResolvedValue(emptyRegistrations);
  mockedGetDashboardSummary.mockResolvedValue({
    totalEvents: 12, upcomingEvents: 4, totalRegistrations: 150, totalCheckIns: 75, attendanceRate: 50,
  });
});

describe('HomePage', () => {
  it('chào đúng tên người dùng và nêu số sự kiện trong 7 ngày tới', async () => {
    mockedGetEvents.mockResolvedValue(
      eventsPage([
        makeEvent({ id: 1, name: 'Hội thảo AI', startAt: '2026-08-17T08:00:00', endAt: '2026-08-17T10:00:00' }),
        makeEvent({ id: 2, name: 'Tiệc trà', startAt: '2026-08-19T14:00:00', endAt: '2026-08-19T16:00:00' }),
        // Ngoài mốc 7 ngày -> không được tính vào câu tóm tắt
        makeEvent({ id: 3, name: 'Hội chợ', startAt: '2026-09-20T08:00:00', endAt: '2026-09-20T17:00:00' }),
      ]),
    );

    renderHome('ROLE_USER');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Nguyễn Văn A');
    expect(screen.getByText('Có 2 sự kiện sẽ diễn ra trong 7 ngày tới.')).toBeInTheDocument();
  });

  /**
   * Lỗi trải nghiệm dễ mắc: /dashboard/summary chỉ cho ADMIN/ORGANIZER, gọi khi là USER
   * sẽ nhận 403 và bắn toast "không đủ quyền" dù người dùng chẳng thao tác gì sai.
   */
  it('không gọi API dashboard khi người dùng thường mở trang chủ', async () => {
    renderHome('ROLE_USER');

    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalled());
    expect(mockedGetDashboardSummary).not.toHaveBeenCalled();
  });

  it('gọi API dashboard và hiện số liệu quản trị khi là ban tổ chức', async () => {
    renderHome('ROLE_ORGANIZER');

    await waitFor(() => expect(mockedGetDashboardSummary).toHaveBeenCalled());
    // Đọc số ngay trong thẻ tương ứng — con số trần có thể trùng với chỗ khác trên trang
    const totalCard = (await screen.findByText('Tổng sự kiện')).closest('a') as HTMLElement;
    expect(within(totalCard).getByText('12')).toBeInTheDocument();
    const rateCard = screen.getByText('Tỷ lệ điểm danh').closest('a') as HTMLElement;
    expect(within(rateCard).getByText('50%')).toBeInTheDocument();
  });

  it('sắp xếp sự kiện gần nhất lên trước và gắn nhãn đếm ngược', async () => {
    mockedGetEvents.mockResolvedValue(
      eventsPage([
        makeEvent({ id: 3, name: 'Sự kiện xa', startAt: '2026-08-25T08:00:00', endAt: '2026-08-25T10:00:00' }),
        makeEvent({ id: 1, name: 'Sự kiện gần', startAt: '2026-08-16T08:00:00', endAt: '2026-08-16T10:00:00' }),
      ]),
    );

    renderHome('ROLE_USER');

    const links = await screen.findAllByRole('link', { name: /Sự kiện (gần|xa)/ });
    expect(links[0]).toHaveTextContent('Sự kiện gần');
    // 15/08 10:00 -> 16/08 08:00 là 22 tiếng, dưới 1 ngày nên đếm theo giờ
    expect(links[0]).toHaveTextContent('Còn 22 giờ');
    expect(links[1]).toHaveTextContent('Còn 10 ngày');
  });

  it('mời người dùng khám phá khi chưa đăng ký sự kiện nào', async () => {
    renderHome('ROLE_USER');

    expect(await screen.findByText('Bạn chưa đăng ký sự kiện nào')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khám phá sự kiện' })).toBeInTheDocument();
  });

  /**
   * Kéo thả bằng chuột không ai dùng được bằng bàn phím, mà đây lại là cách duy nhất để
   * sắp lại bố cục — nên tay cầm phải nhận cả phím mũi tên.
   */
  it('đổi vị trí thẻ bằng phím mũi tên và ghi nhớ thứ tự mới', async () => {
    renderHome('ROLE_USER');
    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalled());

    const cards = screen.getByRole('list', { name: 'Các thẻ của trang chủ' });
    expect(within(cards).getAllByRole('listitem')[0]).toHaveTextContent('Chưa có sự kiện nào sắp diễn ra');

    fireEvent.keyDown(screen.getByRole('button', { name: /Đổi vị trí thẻ Sự kiện tiếp theo/ }), { key: 'ArrowDown' });

    expect(within(cards).getAllByRole('listitem')[0]).toHaveTextContent('Sự kiện của tôi');
    expect(JSON.parse(localStorage.getItem('qlskdd.home.cardOrder') ?? '[]')[0]).toBe('stats');
  });

  it('ẩn lối tắt quản trị với người dùng thường', async () => {
    renderHome('ROLE_USER');

    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalled());
    expect(screen.queryByRole('link', { name: /Dashboard/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Tạo sự kiện/ })).not.toBeInTheDocument();
  });
});
