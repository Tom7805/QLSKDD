import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Button from '../ui/Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  // Esc để huỷ — thói quen chung của mọi hộp thoại, trước đây chỉ Modal có
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  /*
   * Dựng qua portal ở <body> vì lý do giống Modal: chỉ cần một phần tử cha có transform
   * (hiệu ứng chuyển trang) là position:fixed neo sai, hộp thoại rơi khỏi tầm nhìn.
   */
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onMouseDown={() => !loading && onCancel()}
    >
      <div
        className="w-full max-w-sm animate-pop-in rounded-2xl bg-white p-6 shadow-pop"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-[15px] font-bold text-ink">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-6 text-ink-muted">{message}</div>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
