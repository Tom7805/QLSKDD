import type { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useId, useRef, useState } from 'react';

interface QrScannerProps {
  onScan: (code: string) => Promise<void> | void;
  disabled?: boolean;
  onUnavailable?: (message: string) => void;
}

export default function QrScanner({ onScan, disabled = false, onUnavailable }: QrScannerProps) {
  const reactId = useId();
  const elementId = `qr-reader-${reactId.replace(/:/g, '')}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const callbackRef = useRef(onScan);
  const unavailableRef = useRef(onUnavailable);
  const [state, setState] = useState<'starting' | 'active' | 'unavailable'>('starting');
  callbackRef.current = onScan;
  unavailableRef.current = onUnavailable;

  useEffect(() => {
    if (disabled) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable');
      unavailableRef.current?.('Trình duyệt không hỗ trợ camera. Đã chuyển sang nhập mã thủ công.');
      return;
    }

    let disposed = false;

    const startScanner = async () => {
      // Chỉ tải thư viện camera khi người tổ chức thực sự mở máy quét, giữ bundle chính nhẹ.
      const { Html5Qrcode: Html5QrcodeClass } = await import('html5-qrcode');
      if (disposed) return;
      const scanner = new Html5QrcodeClass(elementId, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (width, height) => {
          const edge = Math.floor(Math.min(width, height) * 0.72);
          return { width: edge, height: edge };
        } },
        async (decodedText) => {
          if (busyRef.current) return;
          busyRef.current = true;
          await Promise.resolve(callbackRef.current(decodedText.trim()));
          window.setTimeout(() => { busyRef.current = false; }, 900);
        },
        () => undefined,
      );
      if (!disposed) setState('active');
    };

    void startScanner().catch(() => {
      if (disposed) return;
      setState('unavailable');
      unavailableRef.current?.('Không thể truy cập camera. Bạn có thể nhập mã vé ở ô bên cạnh.');
    });

    return () => {
      disposed = true;
      const current = scannerRef.current;
      scannerRef.current = null;
      if (current?.isScanning) void current.stop().then(() => current.clear()).catch(() => undefined);
      else current?.clear();
    };
  }, [disabled, elementId]);

  if (state === 'unavailable') {
    return <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-200 text-xl">⌁</div><p className="mt-3 font-bold text-slate-700">Camera không khả dụng</p><p className="mt-1 text-sm text-slate-500">Vui lòng dùng mã nhập thủ công.</p></div></div>;
  }

  return (
    <div className="relative min-h-64 overflow-hidden rounded-2xl bg-slate-950">
      <div id={elementId} className="min-h-64 w-full [&_video]:min-h-64 [&_video]:object-cover" />
      {state === 'starting' && <div className="absolute inset-0 grid place-items-center bg-slate-950 text-sm font-semibold text-white"><span className="animate-pulse">Đang khởi động camera…</span></div>}
      {state === 'active' && <div className="pointer-events-none absolute inset-x-5 bottom-4 rounded-xl bg-slate-950/75 px-3 py-2 text-center text-xs font-semibold text-white backdrop-blur">Đặt mã QR vào giữa khung hình</div>}
    </div>
  );
}
