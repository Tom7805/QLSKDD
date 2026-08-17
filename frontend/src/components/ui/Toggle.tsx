interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Mô tả phụ hiện dưới nhãn */
  hint?: string;
  disabled?: boolean;
  /** Chỉ hiện công tắc, không kèm nhãn chữ (khi nhãn đã nằm ở chỗ khác) */
  bare?: boolean;
}

/**
 * Công tắc bật/tắt. Nút tròn trượt bằng transform (không đổi `left`) nên chạy trên GPU,
 * mượt cả khi trang đang bận; rãnh đổi màu cùng lúc để hai chuyển động ăn khớp.
 */
export default function Toggle({ checked, onChange, label, hint, disabled, bare = false }: ToggleProps) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={bare ? label : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5',
        'transition-colors duration-200 ease-out',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-ink/15',
        'disabled:cursor-not-allowed disabled:opacity-40',
        checked ? 'bg-ink' : 'bg-slate-200',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-5 w-5 rounded-full bg-white shadow-sm',
          'transition-transform duration-200 ease-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
        aria-hidden="true"
      />
    </button>
  );

  if (bare) return control;

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-5 text-ink-muted">{hint}</span>}
      </span>
      {control}
    </label>
  );
}
