import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEvents } from '../../events/eventsApi';
import DashboardPage from './DashboardPage';

vi.mock('../../events/eventsApi', () => ({ getEvents: vi.fn() }));

describe('DashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiển thị tỷ lệ tham dự trung bình và theo từng sự kiện', async () => {
    vi.mocked(getEvents).mockResolvedValue({
      content: [
        { id: 1, name: 'Hội thảo AI', location: 'Hội trường A', startAt: '2026-09-01T08:00:00', endAt: '2026-09-01T11:00:00', status: 'OPEN', capacity: 100, availableSeats: 40, attendanceRate: 75 },
        { id: 2, name: 'Tiệc trà', location: 'Phòng chờ', startAt: '2026-08-15T02:47:00', endAt: '2026-08-15T07:47:00', status: 'CLOSED', capacity: 15, availableSeats: 15, attendanceRate: 25 },
      ],
      page: 0,
      size: 100,
      totalElements: 2,
      totalPages: 1,
      last: true,
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Hội thảo AI')).toBeInTheDocument();
    expect(screen.getByText('Tiệc trà')).toBeInTheDocument();
    expect(screen.getByText('Tỷ lệ tham dự trung bình')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('hiển thị trạng thái rỗng khi chưa có sự kiện', async () => {
    vi.mocked(getEvents).mockResolvedValue({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0, last: true });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Chưa có sự kiện nào.')).toBeInTheDocument();
  });
});
