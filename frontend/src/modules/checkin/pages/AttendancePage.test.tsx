import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { getAttendanceList, getAttendanceSummary } from '../checkinApi';
import AttendancePage from './AttendancePage';

vi.mock('../checkinApi', () => ({ getAttendanceSummary: vi.fn(), getAttendanceList: vi.fn() }));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/events/7/attendance']}>
    <Routes><Route path="/events/:eventId/attendance" element={<AttendancePage />} /></Routes>
  </MemoryRouter>,
);

describe('AttendancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAttendanceList).mockResolvedValue({
      content: [
        { registrationId: 1, fullName: 'Nguyễn Văn An', email: 'an@example.com', phone: '0901234567', registeredAt: '2026-08-10T07:00:00', checkedIn: true, checkedInAt: '2026-08-10T08:30:00' },
        { registrationId: 2, fullName: 'Trần Thị Bình', email: 'binh@example.com', phone: null, registeredAt: '2026-08-10T07:10:00', checkedIn: false, checkedInAt: null },
      ],
      page: 0, size: 10, totalElements: 2, totalPages: 1, last: true,
    });
  });

  it('hiển thị số liệu và hai danh sách có mặt, vắng', async () => {
    vi.mocked(getAttendanceSummary).mockResolvedValue({
      summary: { totalRegistered: 2, present: 1, absent: 1, attendanceRate: 50 },
      present: [{ registrationId: 1, fullName: 'Nguyễn Văn An', email: 'an@example.com', phone: null, registeredAt: '2026-08-10T07:00:00', checkedIn: true, checkedInAt: '2026-08-10T08:30:00' }],
      absent: [{ registrationId: 2, fullName: 'Trần Thị Bình', email: 'binh@example.com', phone: null, registeredAt: '2026-08-10T07:10:00', checkedIn: false, checkedInAt: null }],
    });
    renderPage();

    expect((await screen.findAllByText('Nguyễn Văn An')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Trần Thị Bình').length).toBeGreaterThan(0);
    expect(screen.getByText('Tỷ lệ tham dự')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Tỷ lệ tham dự' })).toHaveAttribute('aria-valuenow', '50');
    expect(getAttendanceSummary).toHaveBeenCalledWith(7);
    expect(getAttendanceList).toHaveBeenCalledWith(7, 'all', 0, 10);
  });

  it('hiển thị trạng thái rỗng cho cả hai danh sách', async () => {
    vi.mocked(getAttendanceSummary).mockResolvedValue({
      summary: { totalRegistered: 0, present: 0, absent: 0, attendanceRate: 0 }, present: [], absent: [],
    });
    vi.mocked(getAttendanceList).mockResolvedValue({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, last: true });
    renderPage();
    expect(await screen.findByText('Không có dữ liệu tất cả')).toBeInTheDocument();
  });

  it('đổi bộ lọc thì reset trang và đồng bộ tham số lên URL', async () => {
    vi.mocked(getAttendanceSummary).mockResolvedValue({
      summary: { totalRegistered: 2, present: 1, absent: 1, attendanceRate: 50 }, present: [], absent: [],
    });
    renderPage();
    await screen.findAllByText('Nguyễn Văn An');
    await userEvent.selectOptions(screen.getByLabelText('Trạng thái tham dự'), 'present');
    expect(getAttendanceList).toHaveBeenLastCalledWith(7, 'present', 0, 10);
  });

  it('hiển thị lỗi backend', async () => {
    vi.mocked(getAttendanceSummary).mockRejectedValue({ isAxiosError: true, response: { data: { message: 'Không tìm thấy sự kiện' } } });
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy sự kiện');
  });
});
