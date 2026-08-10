import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAttendanceSummary } from '../checkinApi';
import AttendancePage from './AttendancePage';

vi.mock('../checkinApi', () => ({ getAttendanceSummary: vi.fn() }));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/events/7/attendance']}>
    <Routes><Route path="/events/:eventId/attendance" element={<AttendancePage />} /></Routes>
  </MemoryRouter>,
);

describe('AttendancePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiển thị số liệu và hai danh sách có mặt, vắng', async () => {
    vi.mocked(getAttendanceSummary).mockResolvedValue({
      summary: { totalRegistered: 2, present: 1, absent: 1, attendanceRate: 50 },
      present: [{ registrationId: 1, fullName: 'Nguyễn Văn An', email: 'an@example.com', phone: null, registeredAt: '2026-08-10T07:00:00', checkedInAt: '2026-08-10T08:30:00' }],
      absent: [{ registrationId: 2, fullName: 'Trần Thị Bình', email: 'binh@example.com', phone: null, registeredAt: '2026-08-10T07:10:00', checkedInAt: null }],
    });
    renderPage();

    expect(await screen.findByText('Có mặt (1)')).toBeInTheDocument();
    expect(screen.getByText('Vắng (1)')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
    expect(screen.getByText('Tỷ lệ tham dự 50%')).toBeInTheDocument();
    expect(getAttendanceSummary).toHaveBeenCalledWith(7);
  });

  it('hiển thị trạng thái rỗng cho cả hai danh sách', async () => {
    vi.mocked(getAttendanceSummary).mockResolvedValue({
      summary: { totalRegistered: 0, present: 0, absent: 0, attendanceRate: 0 }, present: [], absent: [],
    });
    renderPage();
    expect(await screen.findByText('Có mặt (0)')).toBeInTheDocument();
    expect(screen.getByText('Vắng (0)')).toBeInTheDocument();
    expect(screen.getAllByText('Không có người tham gia trong danh sách này.')).toHaveLength(2);
  });

  it('hiển thị lỗi backend', async () => {
    vi.mocked(getAttendanceSummary).mockRejectedValue({ isAxiosError: true, response: { data: { message: 'Không tìm thấy sự kiện' } } });
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy sự kiện');
  });
});
