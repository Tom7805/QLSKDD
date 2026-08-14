import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDashboardSummary, getTopEvents } from '../dashboardApi';
import DashboardPage from './DashboardPage';
import { ToastProvider } from '../../../components/common/Toast';

vi.mock('../dashboardApi', () => ({
  getDashboardSummary: vi.fn(),
  getTopEvents: vi.fn(),
  exportEventsCsv: vi.fn(),
}));

const mockSummary = {
  totalEvents: 12,
  upcomingEvents: 4,
  totalRegistrations: 150,
  totalCheckIns: 75,
  attendanceRate: 50,
};

const mockTopEvents = [
  { eventId: 1, eventName: 'Hội thảo AI', capacity: 100, registered: 80, fillRate: 80 },
  { eventId: 2, eventName: 'Tiệc trà', capacity: 20, registered: 10, fillRate: 50 },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <DashboardPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiển thị 4 thẻ số liệu và danh sách sự kiện', async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(mockSummary);
    vi.mocked(getTopEvents).mockResolvedValue(mockTopEvents);

    renderPage();

    expect(await screen.findByText('Tổng sự kiện')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Sắp diễn ra')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Lượt đăng ký')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Tỷ lệ điểm danh')).toBeInTheDocument();
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);

    expect(screen.getByText('Hội thảo AI')).toBeInTheDocument();
    expect(screen.getByText('Tiệc trà')).toBeInTheDocument();
  });

  it('hiển thị trạng thái rỗng khi chưa có sự kiện', async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(mockSummary);
    vi.mocked(getTopEvents).mockResolvedValue([]);

    renderPage();

    expect(await screen.findAllByText('Chưa có sự kiện nào.')).toHaveLength(2);
  });

  it('hiển thị panel xuất báo cáo CSV', async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(mockSummary);
    vi.mocked(getTopEvents).mockResolvedValue(mockTopEvents);

    renderPage();

    expect(await screen.findByText('Xuất báo cáo CSV')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xuất CSV' })).toBeInTheDocument();
  });
});