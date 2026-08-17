import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../../../stores/slices/authSlice';
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

// Trang cần store để lấy tên người dùng cho lời chào ở đầu trang
function renderPage() {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ToastProvider>
          <DashboardPage />
        </ToastProvider>
      </MemoryRouter>
    </Provider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Thứ tự thẻ được nhớ trong localStorage — dọn để mỗi test bắt đầu từ bố cục mặc định
    localStorage.clear();
  });

  it('hiển thị 4 thẻ số liệu và danh sách sự kiện', async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(mockSummary);
    vi.mocked(getTopEvents).mockResolvedValue(mockTopEvents);

    renderPage();

    /*
     * Chờ một CON SỐ chứ không chờ nhãn: nhãn "Tổng sự kiện" có mặt ngay từ lúc thẻ còn
     * đang hiện khung xương, nên nếu chờ nhãn thì các assert số phía sau chạy trước khi
     * dữ liệu kịp về -> test đỏ lúc được lúc không (đã gặp thật khi chạy cả bộ).
     */
    expect(await screen.findByText('12')).toBeInTheDocument();

    // Đọc số ngay trong thẻ tương ứng — con số trần dễ trùng với chỗ khác trên trang.
    // Phải trèo lên tận gốc thẻ (.group): div gần nhất của nhãn chỉ là hàng tiêu đề
    // chứa nhãn + icon, không có con số.
    const cardOf = (label: string) => screen.getByText(label).closest('.group') as HTMLElement;
    expect(within(cardOf('Tổng sự kiện')).getByText('12')).toBeInTheDocument();
    expect(within(cardOf('Sắp diễn ra')).getByText('4')).toBeInTheDocument();
    expect(within(cardOf('Lượt đăng ký')).getByText('150')).toBeInTheDocument();
    expect(within(cardOf('Tỷ lệ điểm danh')).getByText('50%')).toBeInTheDocument();

    expect(screen.getByText('Hội thảo AI')).toBeInTheDocument();
    expect(screen.getByText('Tiệc trà')).toBeInTheDocument();
  });

  it('hiển thị trạng thái rỗng khi chưa có sự kiện', async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(mockSummary);
    vi.mocked(getTopEvents).mockResolvedValue([]);

    renderPage();

    expect(await screen.findAllByText('Chưa có sự kiện nào.')).toHaveLength(2);
  });

  /**
   * Kéo thả bằng chuột không ai dùng được bằng bàn phím, mà đây lại là cách duy nhất để
   * sắp lại bố cục — nên tay cầm phải nhận cả phím mũi tên.
   */
  it('đổi vị trí thẻ bằng phím mũi tên và ghi nhớ thứ tự mới', async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(mockSummary);
    vi.mocked(getTopEvents).mockResolvedValue(mockTopEvents);

    renderPage();
    await screen.findByText('12');

    const stats = screen.getByRole('list', { name: 'Số liệu thống kê' });
    expect(within(stats).getAllByRole('listitem')[0]).toHaveTextContent('Tổng sự kiện');

    fireEvent.keyDown(screen.getByRole('button', { name: /Đổi vị trí thẻ Tổng sự kiện/ }), { key: 'ArrowRight' });

    expect(within(stats).getAllByRole('listitem')[0]).toHaveTextContent('Sắp diễn ra');
    expect(JSON.parse(localStorage.getItem('qlskdd.dashboard.statOrder') ?? '[]')[0]).toBe('Sắp diễn ra');
  });

  it('hiển thị panel xuất báo cáo CSV', async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(mockSummary);
    vi.mocked(getTopEvents).mockResolvedValue(mockTopEvents);

    renderPage();

    expect(await screen.findByText('Xuất báo cáo CSV')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xuất CSV' })).toBeInTheDocument();
  });
});