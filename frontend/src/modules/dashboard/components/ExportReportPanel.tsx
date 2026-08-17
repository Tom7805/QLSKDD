import axios from 'axios';
import { useState } from 'react';
import { exportEventsCsv } from '../dashboardApi';
import { downloadBlob } from '../../../utils/downloadFile';
import { DownloadIcon } from '../../../components/common/Icons';
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

  const fieldClassName =
    'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition-all duration-150 hover:border-slate-300 focus:border-ink/30 focus:ring-4 focus:ring-ink/5';

  return (
    <section
      aria-label="Xuất báo cáo"
      className="flex h-full flex-col glass-card border-emerald-200/80"
    >
      <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-3 sm:px-5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-ink-muted" aria-hidden="true">
          <DownloadIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-bold text-ink">Xuất báo cáo CSV</h2>
          <p className="truncate text-xs text-ink-muted">Chọn khoảng thời gian cần thống kê</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Từ ngày</span>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            className={fieldClassName}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Đến ngày</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            className={fieldClassName}
          />
        </label>

        {!canExport && from !== '' && to !== '' && from > to && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
          </p>
        )}

        <button
          type="button"
          onClick={handleExport}
          disabled={!canExport || exporting}
          className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-ink-soft active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:active:scale-100 raise"
        >
          {exporting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Đang xuất…
            </>
          ) : (
            <>
              <DownloadIcon className="h-4 w-4" />
              Xuất CSV
            </>
          )}
        </button>
      </div>
    </section>
  );
}