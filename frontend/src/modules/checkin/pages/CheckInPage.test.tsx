import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../components/common/Toast';
import { getEventRegistrations } from '../../registrations/registrationsApi';
import { checkInByCode, checkInParticipant } from '../checkinApi';
import CheckInPage from './CheckInPage';

vi.mock('../../registrations/registrationsApi', () => ({ getEventRegistrations: vi.fn() }));
vi.mock('../checkinApi', () => ({ checkInParticipant: vi.fn(), checkInByCode: vi.fn() }));

const participant = {
  id: 11,
  fullName: 'Nguyễn Văn An',
  email: 'an@example.com',
  phone: '0900000000',
  registeredAt: '2026-08-10T08:00:00',
  status: 'ACTIVE' as const,
  checkedIn: false,
};

const renderPage = () => render(
  <ToastProvider>
    <MemoryRouter initialEntries={['/events/7/check-in']}>
      <Routes><Route path="/events/:eventId/check-in" element={<CheckInPage />} /></Routes>
    </MemoryRouter>
  </ToastProvider>,
);

describe('CheckInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEventRegistrations).mockResolvedValue({
      registrations: { content: [participant], page: 0, size: 1000, totalElements: 1, totalPages: 1, last: true },
      summary: { totalRegistered: 1, capacity: 10 },
    });
  });

  it('tìm người tham gia theo họ tên', async () => {
    renderPage();
    expect((await screen.findAllByText('Nguyễn Văn An'))[0]).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'không có' } });
    expect(screen.getByText('Không tìm thấy người tham gia phù hợp.')).toBeInTheDocument();
  });

  it('cập nhật dòng và báo thành công mà không tải lại danh sách', async () => {
    vi.mocked(checkInParticipant).mockResolvedValue({ status: 'SUCCESS', message: 'OK', participantName: participant.fullName, checkedInAt: '2026-08-10T09:00:00' });
    renderPage();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Điểm danh' }))[0]);
    expect(await screen.findByText(`✓ Điểm danh thành công — ${participant.fullName}`)).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: 'Điểm danh' })).toHaveLength(0);
    expect(getEventRegistrations).toHaveBeenCalledTimes(1);
  });

  it('hoàn tác dòng khi API thất bại', async () => {
    vi.mocked(checkInParticipant).mockRejectedValue({ response: { data: { errorCode: 'WRONG_EVENT', message: 'Sai sự kiện' } }, isAxiosError: true });
    renderPage();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Điểm danh' }))[0]);
    expect(await screen.findByText('Sai sự kiện')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Điểm danh' })).toHaveLength(2));
  });

  it('gửi mã bằng Enter và tự xoá ô sau khi điểm danh', async () => {
    vi.mocked(checkInByCode).mockResolvedValue({ status: 'SUCCESS', message: 'OK', participantName: participant.fullName, checkedInAt: '2026-08-10T09:00:00' });
    renderPage();
    const input = await screen.findByLabelText('Mã đăng ký');
    fireEvent.change(input, { target: { value: 'abc12345' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(checkInByCode).toHaveBeenCalledWith({ code: 'ABC12345', eventId: 7 }));
    await waitFor(() => expect(input).toHaveValue(''));
  });
});
