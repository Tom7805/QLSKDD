import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../../stores/store';
import EventRegistrationsPage from './EventRegistrationsPage';
import * as registrationsApi from '../../registrations/registrationsApi';

vi.mock('../../registrations/registrationsApi', () => ({
  getEventRegistrations: vi.fn(),
}));

const mockedGetEventRegistrations = vi.mocked(registrationsApi.getEventRegistrations);

describe('EventRegistrationsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('hiển thị tổng đăng ký và danh sách người tham gia', async () => {
    mockedGetEventRegistrations.mockResolvedValueOnce({
      registrations: {
        content: [
          {
            id: 1,
            fullName: 'Nguyễn Văn A',
            email: 'a@example.com',
            phone: '0912345678',
            registeredAt: '2024-11-01T10:00:00',
            status: 'ACTIVE',
            checkedIn: false,
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        last: true,
      },
      summary: {
        totalRegistered: 1,
        capacity: 10,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/events/7/registrations']}>
          <Routes>
            <Route path="/events/:eventId/registrations" element={<EventRegistrationsPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(await screen.findByText('Đã đăng ký: 1 / 10')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('a@example.com')).toBeInTheDocument();
  });
});
