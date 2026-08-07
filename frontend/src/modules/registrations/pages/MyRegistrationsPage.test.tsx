import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../components/common/Toast';
import MyRegistrationsPage from './MyRegistrationsPage';
import * as registrationsApi from '../registrationsApi';

vi.mock('../registrationsApi', () => ({
  getMyRegistrations: vi.fn(),
  cancelRegistration: vi.fn(),
}));

const mockedGetMyRegistrations = vi.mocked(registrationsApi.getMyRegistrations);
const mockedCancelRegistration = vi.mocked(registrationsApi.cancelRegistration);

function renderPage() {
  render(
    <MemoryRouter>
      <ToastProvider>
        <MyRegistrationsPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('MyRegistrationsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('hiển thị danh sách đăng ký và cho phép huỷ đăng ký', async () => {
    mockedGetMyRegistrations.mockResolvedValueOnce({
      content: [
        {
          registrationId: 10,
          code: 'ABC-123',
          registrationStatus: 'ACTIVE',
          registeredAt: '2024-11-01T10:00:00',
          eventId: 7,
          eventName: 'Hội thảo AI',
          location: 'Hà Nội',
          startAt: '2024-12-01T09:00:00',
          endAt: '2024-12-01T11:00:00',
          eventStatus: 'OPEN',
          canCancel: true,
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });
    mockedCancelRegistration.mockResolvedValueOnce(undefined);

    renderPage();

    expect(await screen.findByText('Hội thảo AI')).toBeInTheDocument();

    const listButton = screen.getAllByRole('button', { name: 'Huỷ đăng ký' })[0];
    await userEvent.click(listButton);

    const confirmButton = screen.getAllByRole('button', { name: 'Huỷ đăng ký' })[1];
    await userEvent.click(confirmButton);

    await waitFor(() => expect(mockedCancelRegistration).toHaveBeenCalledWith(10));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
