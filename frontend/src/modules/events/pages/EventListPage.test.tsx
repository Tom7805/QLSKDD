import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../../../stores/slices/authSlice';
import * as eventsApi from '../eventsApi';
import type { EventsPage } from '../eventsTypes';
import EventListPage from './EventListPage';

vi.mock('../eventsApi');

const mockedGetEvents = vi.mocked(eventsApi.getEvents);
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
  });

  it('đọc từ khóa từ URL và hiển thị trạng thái không tìm thấy đúng ngữ cảnh', async () => {
    renderPage('/events?keyword=H%E1%BB%99i%20th%E1%BA%A3o');

    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledWith(0, 9, 'Hội thảo'));
    expect(await screen.findByText("Không tìm thấy sự kiện phù hợp với 'Hội thảo'")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xóa bộ lọc' })).toBeInTheDocument();
  });

  it('chỉ tìm sau thời gian debounce và cho phép xóa nhanh nội dung', async () => {
    renderPage();
    await waitFor(() => expect(mockedGetEvents).toHaveBeenCalledTimes(1));

    const input = screen.getByRole('searchbox', { name: 'Tìm theo tên hoặc địa điểm...' });
    fireEvent.change(input, { target: { value: '  Nhà văn hóa  ' } });
    expect(mockedGetEvents).toHaveBeenCalledTimes(1);

    await waitFor(
      () => expect(mockedGetEvents).toHaveBeenLastCalledWith(0, 9, 'Nhà văn hóa'),
      { timeout: 1200 },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Xóa nội dung tìm kiếm' }));
    expect(input).toHaveValue('');
    await waitFor(() => expect(mockedGetEvents).toHaveBeenLastCalledWith(0, 9, ''), { timeout: 1200 });
  });
});
