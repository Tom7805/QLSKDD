import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({ open, title, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  /*
   * Bắt buộc dựng qua portal ở <body>: hộp thoại dùng position:fixed, mà chỉ cần MỘT
   * phần tử cha bất kỳ có transform (ví dụ hiệu ứng chuyển trang .animate-page) là
   * fixed sẽ neo theo phần tử đó thay vì theo màn hình — hộp thoại rơi xuống giữa
   * chiều cao toàn trang và người dùng phải cuộn mới thấy.
   */
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-950/40 p-0 backdrop-blur-[2px] sm:p-4"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="flex h-full w-full animate-pop-in flex-col bg-white shadow-pop sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:max-w-lg sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <h2 id="modal-title" className="text-[15px] font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-2 text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-ink active:scale-90"
          >
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
