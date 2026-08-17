import axios from 'axios';
import { useEffect, useState } from 'react';
import Modal from '../../../components/common/Modal';
import { useToast } from '../../../components/common/Toast';
import { ClockIcon, DownloadIcon, TicketIcon } from '../../../components/common/Icons';
import Button from '../../../components/ui/Button';
import { getRegistrationQr } from '../registrationsApi';

interface QrTicketModalProps {
  open: boolean;
  registrationId: number | null;
  code: string;
  eventName: string;
  /** Có thì vé hiện đủ giờ bắt đầu → kết thúc và thời lượng ở giữa */
  startAt?: string | null;
  endAt?: string | null;
  location?: string | null;
  attendeeName?: string | null;
  onClose: () => void;
}

const formatHhMm = (value: string) => {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatDayLabel = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: 'short' })
    .format(new Date(value))
    .toUpperCase();

/** Thời lượng gọn cho viên thuốc ở giữa hai mốc giờ */
function formatDuration(startAt: string, endAt: string) {
  const minutes = Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  if (hours > 0) return mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
  return `${mins} phút`;
}

/** Một ô thông tin có nhãn nhỏ phía trên — dùng cho hàng "Người tham dự / Địa điểm" */
function Field({ label, value, align = 'left' }: { label: string; value: string; align?: 'left' | 'right' }) {
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
      <p className="text-[11px] font-medium text-ink-muted">{label}</p>
      <p className="mt-0.5 truncate text-[13.5px] font-bold text-ink">{value}</p>
    </div>
  );
}

export default function QrTicketModal({
  open,
  registrationId,
  code,
  eventName,
  startAt,
  endAt,
  location,
  attendeeName,
  onClose,
}: QrTicketModalProps) {
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !registrationId) return;
    let active = true;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);
    getRegistrationQr(registrationId)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message : undefined;
        setError(message ?? 'Không tải được ảnh QR. Bạn vẫn có thể dùng mã chữ.');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setImageUrl(null);
    };
  }, [open, registrationId]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('Đã sao chép mã đăng ký', 'success');
    } catch {
      showToast('Không thể sao chép tự động. Hãy chọn và sao chép mã.', 'warning');
    }
  };

  const downloadQr = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ve-${code}.png`;
    link.click();
  };

  const duration = startAt && endAt ? formatDuration(startAt, endAt) : null;

  return (
    <Modal open={open} title="Vé tham dự" onClose={onClose}>
      {/* Thẻ vé: nửa trên là thông tin, nửa dưới (nền xám) là phần soát vé — ngăn cách
          bằng đường răng cưa và hai vết khuyết hai bên như vé giấy thật */}
      <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-hairline bg-white shadow-card">
        <div className="px-5 pb-4 pt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-wide text-ink">
              <TicketIcon className="h-[18px] w-[18px] text-ink-muted" />
              <span className="font-mono">{code}</span>
            </span>
            {startAt && (
              <span className="shrink-0 text-[11.5px] font-bold tracking-wide text-ink-muted">
                {formatDayLabel(startAt)}
              </span>
            )}
          </div>

          <h3 className="mt-3 truncate text-lg font-extrabold text-ink" title={eventName}>
            {eventName}
          </h3>

          {startAt && endAt ? (
            <>
              {/* Hàng giờ: bắt đầu — thời lượng — kết thúc, nối bằng đường chấm */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-2xl font-extrabold tabular-nums text-ink">{formatHhMm(startAt)}</span>
                <span className="flex flex-1 items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />
                  <span className="h-px flex-1 border-t border-dashed border-slate-300" aria-hidden="true" />
                  {duration && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-ink-muted">
                      <ClockIcon className="h-3 w-3" />
                      {duration}
                    </span>
                  )}
                  <span className="h-px flex-1 border-t border-dashed border-slate-300" aria-hidden="true" />
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />
                </span>
                <span className="text-2xl font-extrabold tabular-nums text-ink">{formatHhMm(endAt)}</span>
              </div>

              <p className="mt-2 flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Đăng ký thành công
              </p>
            </>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Đăng ký thành công
            </p>
          )}

          {(attendeeName || location) && (
            <div className="mt-4 flex items-start justify-between gap-4 border-t border-hairline pt-4">
              {attendeeName && <Field label="Người tham dự" value={attendeeName} />}
              {location && <Field label="Địa điểm" value={location} align={attendeeName ? 'right' : 'left'} />}
            </div>
          )}
        </div>

        {/* Đường răng cưa + hai vết khuyết */}
        <div className="relative h-0">
          <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-hairline bg-white" aria-hidden="true" />
          <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-hairline bg-white" aria-hidden="true" />
          <span className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-slate-200" aria-hidden="true" />
        </div>

        <div className="flex items-center gap-4 bg-slate-50/80 px-5 pb-5 pt-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-ink-muted">Mã nhập thủ công</p>
            <p className="mt-1 break-all font-mono text-lg font-black tracking-[0.14em] text-ink">{code}</p>
            <p className="mt-2 text-[11px] leading-4 text-ink-muted">
              Đưa mã QR hoặc đọc mã này cho ban tổ chức khi đến sự kiện.
            </p>
          </div>

          <div className="shrink-0">
            <div className="grid h-[104px] w-[104px] place-items-center overflow-hidden rounded-xl border border-hairline bg-white p-1.5">
              {loading && <div className="skeleton h-full w-full rounded-lg" aria-label="Đang tải mã QR" />}
              {!loading && imageUrl && (
                <img src={imageUrl} alt={`Mã QR vé ${eventName}`} className="h-full w-full object-contain" />
              )}
              {!loading && error && <span className="px-1 text-center text-[10px] font-medium text-amber-700">{error}</span>}
            </div>
            <p className="mt-1.5 text-center text-[10px] text-ink-muted">Quét để điểm danh</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-sm gap-2.5">
        <Button type="button" onClick={downloadQr} disabled={!imageUrl} block iconLeft={<DownloadIcon className="h-4 w-4" />}>
          Tải ảnh QR
        </Button>
        <Button type="button" variant="secondary" onClick={copyCode} block>
          Sao chép mã
        </Button>
      </div>

      <p className="mx-auto mt-3 max-w-sm text-center text-[11px] leading-5 text-slate-400">
        Ảnh QR và mã chữ chứa cùng một mã vé. Không chia sẻ vé với người khác.
      </p>
    </Modal>
  );
}
