import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../../../stores/slices/authSlice';
import * as categoriesApi from '../../categories/categoriesApi';
import * as eventsApi from '../eventsApi';
import type { EventsPage } from '../eventsTypes';
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

describe('EventListPage search', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedGetEvents.mockResolvedValue(emptyPage);
    mockedGetCategories.mockResolvedValue([{ id: 7, name: 'Hội thảo', description: null, eventCount: 2 }]);
  });

  it('đọc từ khóa từ URL và hiển thị trạng thái không tìm thấy đúng ngữ cảnh', async () => {
    renderPage('/events?keyword=H%E1%BB%99i%20th%E1%BA%A3o');

    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledWith(0, 9, 'Hội thảo', {}));
    expect(await screen.findByText("Không tìm thấy sự kiện phù hợp với 'Hội thảo'")).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Xóa bộ lọc' }).some((button) => !button.hasAttribute('disabled'))).toBe(true);
  });

  it('chỉ tìm sau thời gian debounce và cho phép xóa nhanh nội dung', async () => {
    renderPage();
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
    renderPage('/events?keyword=AI&categoryId=7&status=OPEN&from=2026-08-01&to=2026-08-31&page=3');

    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledWith(2, 9, 'AI', {
      categoryId: 7,
      status: 'OPEN',
      from: '2026-08-01',
      to: '2026-08-31',
    }));
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('đổi bộ lọc desktop và đưa phân trang về trang đầu', async () => {
    renderPage('/events?keyword=AI&page=4');
    await waitFor(() => expect(mockedGetCategories).toHaveBeenCalled());

    fireEvent.change(screen.getAllByLabelText('Loại sự kiện')[0], { target: { value: '7' } });
    await waitFor(() => expect(mockedGetEvents).toHaveBeenLastCalledWith(0, 9, 'AI', { categoryId: 7 }));
  });
});
