import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../../../stores/slices/authSlice';
import * as categoriesApi from '../../categories/categoriesApi';
import * as eventsApi from '../eventsApi';
import type { EventsPage, EventSummary } from '../eventsTypes';
import EventListPage from './EventListPage';

vi.mock('../eventsApi');
vi.mock('../../categories/categoriesApi');

const mockedGetEvents = vi.mocked(eventsApi.getEvents);
const mockedGetCategories = vi.mocked(categoriesApi.getCategories);

const emptyPage: EventsPage = {
  content: [],
  page: 0,
  size: 9,
  totalElements: 0,
  totalPages: 0,
  last: true,
};

/**
 * Mốc neo cố định cho các test chế độ lịch: mọi ngày trong tháng 8/2026 đều quy về đúng
 * tháng đó. Truyền qua URL để khoảng ngày gửi lên API là tất định, không phụ thuộc ngày
 * chạy test. Khoảng tải nới 7 ngày về trước để bắt cả sự kiện gối đầu từ tháng trước.
 */
const ANCHOR = '2026-08-10';
const MONTH_RANGE = { from: '2026-07-25', to: '2026-08-31' };
const CALENDAR_SIZE = 200;

/**
 * Ghim đồng hồ vào Thứ 7 15/08/2026 10:00. Bộ lọc "đã/chưa kết thúc" so endAt với thời
 * điểm hiện tại, nên nếu để đồng hồ thật thì test sẽ đổi kết quả theo ngày chạy. Chỉ giả
 * lập Date — setTimeout vẫn thật để debounce và waitFor chạy bình thường.
 */
const NOW = new Date('2026-08-15T10:00:00');

function makeEvent(overrides: Partial<EventSummary> & Pick<EventSummary, 'id' | 'name' | 'startAt' | 'endAt'>): EventSummary {
  return {
    location: 'Đà Nẵng',
    status: 'OPEN',
    capacity: 30,
    availableSeats: 12,
    attendanceRate: 0,
    categoryId: 7,
    categoryName: 'Hội thảo',
    ...overrides,
  };
}

function pageOf(content: EventSummary[]): EventsPage {
  return { content, page: 0, size: CALENDAR_SIZE, totalElements: content.length, totalPages: 1, last: true };
}

function renderPage(initialEntry = '/events') {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/events" element={<EventListPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  vi.resetAllMocks();
  mockedGetEvents.mockResolvedValue(emptyPage);
  mockedGetCategories.mockResolvedValue([{ id: 7, name: 'Hội thảo', description: null, eventCount: 2 }]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EventListPage — chế độ danh sách', () => {
  it('đọc từ khóa từ URL và hiển thị trạng thái không tìm thấy đúng ngữ cảnh', async () => {
    renderPage('/events?view=list&keyword=H%E1%BB%99i%20th%E1%BA%A3o');

    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledWith(0, 9, 'Hội thảo', {}));
    expect(await screen.findByText("Không tìm thấy sự kiện phù hợp với 'Hội thảo'")).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Xóa bộ lọc' }).some((button) => !button.hasAttribute('disabled'))).toBe(true);
  });

  it('chỉ tìm sau thời gian debounce và cho phép xóa nhanh nội dung', async () => {
    renderPage('/events?view=list');
    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledTimes(1));

    const input = screen.getByRole('searchbox', { name: 'Tìm theo tên hoặc địa điểm...' });
    fireEvent.change(input, { target: { value: '  Nhà văn hóa  ' } });
    expect(mockedGetEvents).toHaveBeenCalledTimes(1);

    await waitFor(
      () => expect(mockedGetEvents).toHaveBeenLastCalledWith(0, 9, 'Nhà văn hóa', {}),
      { timeout: 1200 },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Xóa nội dung tìm kiếm' }));
    expect(input).toHaveValue('');
    await waitFor(() => expect(mockedGetEvents).toHaveBeenLastCalledWith(0, 9, '', {}), { timeout: 1200 });
  });

  it('đọc bộ lọc từ URL, gọi đúng API và giữ từ khóa đi kèm', async () => {
    renderPage('/events?view=list&keyword=AI&categoryId=7&status=OPEN&from=2026-08-01&to=2026-08-31&page=3');

    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledWith(2, 9, 'AI', {
      categoryId: 7,
      status: 'OPEN',
      from: '2026-08-01',
      to: '2026-08-31',
    }));
    // Cả 4 điều kiện (loại, trạng thái, từ ngày, đến ngày) đều được tính là bộ lọc đang bật
    expect(screen.getByRole('button', { name: 'Xóa bộ lọc 4' })).toBeInTheDocument();
  });

  it('đổi bộ lọc ở rail và đưa phân trang về trang đầu', async () => {
    renderPage('/events?view=list&keyword=AI&page=4');
    await waitFor(() => expect(mockedGetCategories).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Hội thảo' }));
    await waitFor(() => expect(mockedGetEvents).toHaveBeenLastCalledWith(0, 9, 'AI', { categoryId: 7 }));
  });
});

describe('EventListPage — chế độ lịch', () => {
  it('mặc định mở chế độ lịch, tải trọn tháng trong một lần và không phân trang', async () => {
    renderPage(`/events?week=${ANCHOR}`);

    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledWith(0, CALENDAR_SIZE, '', MONTH_RANGE));
    expect(screen.getByRole('button', { name: 'Lịch' })).toHaveAttribute('aria-pressed', 'true');
    // Intl trả về chữ thường ("tháng 8 năm 2026"); chữ hoa đầu dòng là do CSS capitalize
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('tháng 8 năm 2026');
    // Không có thanh phân trang ở chế độ lịch
    expect(screen.queryByRole('navigation', { name: /trang/i })).not.toBeInTheDocument();
  });

  /** Link cũ từ thời còn ba tab Ngày/Tuần/Tháng vẫn phải mở được, không rơi vào trang trắng */
  it('đưa các link view=day / view=month cũ về chung chế độ lịch', async () => {
    renderPage(`/events?view=day&week=${ANCHOR}`);

    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledWith(0, CALENDAR_SIZE, '', MONTH_RANGE));
    expect(screen.getByRole('button', { name: 'Lịch' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('lọc theo loại sự kiện và bỏ lọc khi bấm lại', async () => {
    renderPage(`/events?week=${ANCHOR}`);
    await waitFor(() => expect(mockedGetCategories).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Hội thảo' }));
    await waitFor(() =>
      expect(mockedGetEvents).toHaveBeenLastCalledWith(0, CALENDAR_SIZE, '', { categoryId: 7, ...MONTH_RANGE }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hội thảo' }));
    await waitFor(() => expect(mockedGetEvents).toHaveBeenLastCalledWith(0, CALENDAR_SIZE, '', MONTH_RANGE));
  });

  /**
   * Sự kiện nhiều ngày phải là MỘT dòng với MỘT thanh, không lặp tên ở từng ô — lặp tên
   * khiến một sự kiện 3 ngày trông như 3 sự kiện khác nhau, gây rối khi đọc lịch.
   */
  it('mỗi sự kiện là một dòng với một thanh duy nhất, ghi rõ số ngày', async () => {
    mockedGetEvents.mockResolvedValue(
      pageOf([
        makeEvent({ id: 1, name: 'Hội thảo AI', startAt: '2026-08-16T08:00:00', endAt: '2026-08-16T10:00:00' }),
        makeEvent({ id: 2, name: 'Triển lãm', startAt: '2026-08-12T14:00:00', endAt: '2026-08-14T17:00:00' }),
      ]),
    );

    renderPage(`/events?week=${ANCHOR}`);

    await waitFor(() => expect(screen.getAllByRole('button', { name: /Hội thảo AI/ })).toHaveLength(1));
    const bars = screen.getAllByRole('button', { name: /Triển lãm/ });
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveTextContent('3 ngày');
  });

  it('sự kiện gọn trong ngày thì thanh ghi giờ bắt đầu', async () => {
    mockedGetEvents.mockResolvedValue(
      pageOf([makeEvent({ id: 3, name: 'Tiệc trà', startAt: '2026-08-18T14:30:00', endAt: '2026-08-18T16:00:00' })]),
    );

    renderPage(`/events?week=${ANCHOR}`);

    const row = await screen.findByRole('button', { name: /Tiệc trà/ });
    expect(row).toHaveTextContent('14:30');
  });

  it('hàng đầu bảng ghi đủ số ngày trong tháng để vẫn đọc được như một cuốn lịch', async () => {
    renderPage(`/events?week=${ANCHOR}`);
    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalled());

    const axis = screen.getByRole('group', { name: 'Các ngày trong tháng' });
    expect(within(axis).getByText('1')).toBeInTheDocument();
    expect(within(axis).getByText('31')).toBeInTheDocument();
  });

  it('báo trống ngay trên lịch khi cả tháng không có sự kiện nào', async () => {
    renderPage(`/events?week=${ANCHOR}`);

    expect(await screen.findByText('Tháng này chưa có sự kiện nào')).toBeInTheDocument();
  });

  it('báo không tìm thấy ngay trên lịch khi từ khóa không khớp sự kiện nào', async () => {
    renderPage(`/events?week=${ANCHOR}&keyword=khong-ton-tai`);

    expect(await screen.findByText("Không tìm thấy sự kiện phù hợp với 'khong-ton-tai'")).toBeInTheDocument();
  });

  it('chuyển sang chế độ danh sách bằng nút gạt và gọi API phân trang lại', async () => {
    renderPage(`/events?week=${ANCHOR}`);
    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Danh sách' }));

    await waitFor(() => expect(mockedGetEvents).toHaveBeenLastCalledWith(0, 9, '', {}));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Danh sách sự kiện');
  });

  it('chuyển sang tháng sau khi bấm điều hướng', async () => {
    renderPage(`/events?week=${ANCHOR}`);
    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Tháng sau' }));

    await waitFor(() =>
      expect(mockedGetEvents).toHaveBeenLastCalledWith(0, CALENDAR_SIZE, '', { from: '2026-08-25', to: '2026-09-30' }),
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('tháng 9 năm 2026');
  });

  it('quay lại tháng trước khi bấm điều hướng ngược', async () => {
    renderPage(`/events?week=${ANCHOR}`);
    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Tháng trước' }));

    await waitFor(() =>
      expect(mockedGetEvents).toHaveBeenLastCalledWith(0, CALENDAR_SIZE, '', { from: '2026-06-24', to: '2026-07-31' }),
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('tháng 7 năm 2026');
  });

  /**
   * Nút "Hôm nay" từng bị khoá khi đang đứng ở khoảng chứa hôm nay — nút xám không bấm
   * được trông y hệt nút hỏng, người dùng tưởng điều hướng chết.
   */
  it('không khoá nút Hôm nay ngay cả khi đang ở tháng chứa hôm nay', async () => {
    renderPage('/events');
    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalled());

    const todayButton = screen.getByRole('button', { name: 'Hôm nay' });
    expect(todayButton).not.toBeDisabled();
    expect(todayButton).toHaveAttribute('aria-current', 'date');
  });

  it('bấm Hôm nay thì kéo lịch về đúng tháng chứa hôm nay', async () => {
    renderPage('/events?week=2026-11-01');
    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalled());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('tháng 11 năm 2026');

    fireEvent.click(screen.getByRole('button', { name: 'Hôm nay' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('tháng 8 năm 2026'),
    );
    expect(mockedGetEvents).toHaveBeenLastCalledWith(0, CALENDAR_SIZE, '', MONTH_RANGE);
  });
});

describe('EventListPage — sự kiện đã kết thúc', () => {
  const FINISHED = makeEvent({ id: 1, name: 'Tiệc cưới', startAt: '2026-08-13T09:00:00', endAt: '2026-08-14T17:00:00' });
  const SOON = makeEvent({ id: 2, name: 'Hội thảo AI', startAt: '2026-08-16T08:00:00', endAt: '2026-08-16T10:00:00' });

  /**
   * Không còn bộ lọc theo mốc thời gian: bảng lịch đã bày sẵn vị trí từng sự kiện so với
   * cột hôm nay và làm mờ cái đã xong, nên mọi sự kiện của tháng đều phải có mặt.
   */
  it('hiện mọi sự kiện của tháng, kể cả sự kiện đã diễn ra xong', async () => {
    mockedGetEvents.mockResolvedValue(pageOf([FINISHED, SOON]));

    renderPage(`/events?week=${ANCHOR}`);

    await waitFor(() => expect(screen.getByRole('button', { name: /Hội thảo AI/ })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Tiệc cưới/ })).toBeInTheDocument();
  });
});
