import axios from 'axios';
import { useState } from 'react';
import { exportEventsCsv } from '../dashboardApi';
import { downloadBlob } from '../../../utils/downloadFile';
import { useToast } from '../../../components/common/Toast';

// B5.5-T4: giao diện xuất báo cáo CSV theo khoảng thời gian. Chọn from/to (yyyy-MM-dd),
// bấm "Xuất CSV" → gọi API lấy blob → tạo link tải tự động. Nút hiện loading trong lúc
// chờ, xong hiện toast "Đã tải báo cáo". Chỉ ADMIN/ORGANIZER thấy panel này (backend
// cũng chặn 403 nếu thiếu quyền).
export default function ExportReportPanel() {
  const { showToast } = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const canExport = from !== '' && to !== '' && from <= to;

  const handleExport = async () => {
    if (!canExport || exporting) return;

    setExporting(true);
    try {
      const blob = await exportEventsCsv(from, to);
      downloadBlob(blob, 'bao-cao.csv');
      showToast('Đã tải báo cáo');
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message
        : undefined;
      showToast(message ?? 'Không thể xuất báo cáo. Vui lòng thử lại.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <section
      aria-label="Xuất báo cáo"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Xuất báo cáo CSV</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Từ ngày
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Đến ngày
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <button
          type="button"
          onClick={handleExport}
          disabled={!canExport || exporting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Đang xuất…
            </>
          ) : (
            'Xuất CSV'
          )}
        </button>
      </div>
      {!canExport && from !== '' && to !== '' && from > to && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
        </p>
      )}
    </section>
  );
}