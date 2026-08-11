import axios from 'axios';
import { useEffect, useState } from 'react';
import Modal from '../../../components/common/Modal';
import { useToast } from '../../../components/common/Toast';
import { getRegistrationQr } from '../registrationsApi';

interface QrTicketModalProps {
  open: boolean;
  registrationId: number | null;
  code: string;
  eventName: string;
  onClose: () => void;
}

export default function QrTicketModal({ open, registrationId, code, eventName, onClose }: QrTicketModalProps) {
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
        setError(message ?? 'Không thể tải ảnh QR. Bạn vẫn có thể dùng mã chữ bên dưới.');
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

  return (
    <Modal open={open} title="Vé tham dự của bạn" onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white">✓</span>
          Đăng ký thành công
        </div>
        <h3 className="mt-4 text-xl font-extrabold text-slate-900">{eventName}</h3>
        <p className="mt-1 text-sm text-slate-500">Đưa mã này cho ban tổ chức khi đến sự kiện</p>

        <div className="relative mx-auto mt-6 grid aspect-square w-full max-w-[18rem] place-items-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
          <span className="absolute left-0 top-0 h-8 w-8 rounded-br-2xl border-l-4 border-t-4 border-blue-600" />
          <span className="absolute right-0 top-0 h-8 w-8 rounded-bl-2xl border-r-4 border-t-4 border-blue-600" />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-tr-2xl border-b-4 border-l-4 border-blue-600" />
          <span className="absolute bottom-0 right-0 h-8 w-8 rounded-tl-2xl border-b-4 border-r-4 border-blue-600" />
          {loading && <div className="h-44 w-44 animate-pulse rounded-2xl bg-slate-100" aria-label="Đang tải mã QR" />}
          {!loading && imageUrl && <img src={imageUrl} alt={`Mã QR vé ${eventName}`} className="h-full w-full object-contain" />}
          {!loading && error && <div className="px-4 text-sm font-medium text-amber-700">{error}</div>}
        </div>

        <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-slate-950 px-5 py-4 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Mã nhập thủ công</p>
          <p className="mt-2 break-all font-mono text-2xl font-black tracking-[0.18em] sm:text-3xl">{code}</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" onClick={downloadQr} disabled={!imageUrl} className="min-h-12 rounded-xl bg-blue-600 px-4 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">↓ Tải ảnh QR</button>
          <button type="button" onClick={copyCode} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">▣ Sao chép mã</button>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-400">Ảnh QR và mã chữ chứa cùng một mã vé. Không chia sẻ vé với người khác.</p>
      </div>
    </Modal>
  );
}
