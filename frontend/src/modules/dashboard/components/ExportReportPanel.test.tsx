import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportEventsCsv } from '../dashboardApi';
import { downloadBlob } from '../../../utils/downloadFile';
import { ToastProvider } from '../../../components/common/Toast';
import ExportReportPanel from './ExportReportPanel';

vi.mock('../dashboardApi', () => ({
  exportEventsCsv: vi.fn(),
}));

vi.mock('../../../utils/downloadFile', () => ({
  downloadBlob: vi.fn(),
}));

const mockBlob = new Blob(['id,name\n1,Hội thảo'], { type: 'text/csv' });

function renderPanel() {
  return render(
    <ToastProvider>
      <ExportReportPanel />
    </ToastProvider>,
  );
}

describe('ExportReportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exportEventsCsv).mockResolvedValue(mockBlob);
  });

  it('vô hiệu hoá nút Xuất CSV khi chưa chọn đủ ngày', () => {
    renderPanel();

    const button = screen.getByRole('button', { name: 'Xuất CSV' });
    expect(button).toBeDisabled();
  });

  it('bật nút Xuất CSV khi đã chọn đủ ngày hợp lệ', async () => {
    const user = userEvent.setup();
    renderPanel();

    const fromInput = screen.getByLabelText('Từ ngày') as HTMLInputElement;
    const toInput = screen.getByLabelText('Đến ngày') as HTMLInputElement;

    await user.type(fromInput, '2026-01-01');
    await user.type(toInput, '2026-01-31');

    expect(screen.getByRole('button', { name: 'Xuất CSV' })).toBeEnabled();
  });

  it('hiển thị cảnh báo khi ngày bắt đầu lớn hơn ngày kết thúc', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText('Từ ngày'), '2026-02-01');
    await user.type(screen.getByLabelText('Đến ngày'), '2026-01-31');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.',
    );
    expect(screen.getByRole('button', { name: 'Xuất CSV' })).toBeDisabled();
  });

  it('gọi API, tải file và hiển thị toast thành công khi xuất báo cáo', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText('Từ ngày'), '2026-01-01');
    await user.type(screen.getByLabelText('Đến ngày'), '2026-01-31');
    await user.click(screen.getByRole('button', { name: 'Xuất CSV' }));

    await waitFor(() => {
      expect(exportEventsCsv).toHaveBeenCalledWith('2026-01-01', '2026-01-31');
      expect(downloadBlob).toHaveBeenCalledWith(mockBlob, 'bao-cao.csv');
    });

    expect(await screen.findByText('Đã tải báo cáo')).toBeInTheDocument();
  });

  it('hiển thị loading trên nút trong lúc chờ API trả về', async () => {
    const user = userEvent.setup();
    let resolveExport: (value: Blob) => void;
    vi.mocked(exportEventsCsv).mockImplementation(
      () =>
        new Promise<Blob>((resolve) => {
          resolveExport = resolve;
        }),
    );

    renderPanel();

    await user.type(screen.getByLabelText('Từ ngày'), '2026-01-01');
    await user.type(screen.getByLabelText('Đến ngày'), '2026-01-31');
    await user.click(screen.getByRole('button', { name: 'Xuất CSV' }));

    expect(screen.getByRole('button', { name: /Đang xuất…/ })).toBeDisabled();

    resolveExport!(mockBlob);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Xuất CSV' })).toBeEnabled();
    });
  });

  it('hiển thị toast lỗi khi API xuất báo cáo thất bại', async () => {
    const user = userEvent.setup();
    vi.mocked(exportEventsCsv).mockRejectedValue(new Error('Network error'));

    renderPanel();

    await user.type(screen.getByLabelText('Từ ngày'), '2026-01-01');
    await user.type(screen.getByLabelText('Đến ngày'), '2026-01-31');
    await user.click(screen.getByRole('button', { name: 'Xuất CSV' }));

    expect(
      await screen.findByText('Không thể xuất báo cáo. Vui lòng thử lại.'),
    ).toBeInTheDocument();
    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it('không gọi API khi bấm nút đang trong trạng thái loading', async () => {
    const user = userEvent.setup();
    let resolveExport: (value: Blob) => void;
    vi.mocked(exportEventsCsv).mockImplementation(
      () =>
        new Promise<Blob>((resolve) => {
          resolveExport = resolve;
        }),
    );

    renderPanel();

    await user.type(screen.getByLabelText('Từ ngày'), '2026-01-01');
    await user.type(screen.getByLabelText('Đến ngày'), '2026-01-31');
    await user.click(screen.getByRole('button', { name: 'Xuất CSV' }));

    expect(exportEventsCsv).toHaveBeenCalledTimes(1);

    // Cố bấm lại khi đang loading
    await user.click(screen.getByRole('button', { name: /Đang xuất…/ }));

    expect(exportEventsCsv).toHaveBeenCalledTimes(1);

    resolveExport!(mockBlob);
  });
});