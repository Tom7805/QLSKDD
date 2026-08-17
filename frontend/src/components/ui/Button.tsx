import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Bo tròn hết cỡ kiểu viên thuốc — dùng cho nút hành động nổi bật */
  pill?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/15 disabled:translate-y-0 disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
  secondary:
    'bg-white text-ink shadow-sm ring-1 ring-inset ring-slate-200 hover:-translate-y-0.5 hover:ring-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-700 disabled:translate-y-0 disabled:text-slate-300 disabled:ring-slate-100 disabled:shadow-none',
  ghost: 'bg-transparent text-ink-muted hover:bg-slate-100 hover:text-ink disabled:text-slate-300',
  danger: 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/20 disabled:translate-y-0 disabled:bg-none disabled:bg-red-200 disabled:shadow-none',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-[12.5px] gap-1.5',
  md: 'h-10 px-4 text-[13px] gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

/**
 * Nút dùng chung của hệ thống.
 *
 * Vi tương tác: nhấn xuống thì lún nhẹ (scale 0.97) và bóng co lại, nhả ra thì bật về —
 * cho cảm giác chạm được vào vật thể. Khi loading thì nhãn mờ đi tại chỗ và con quay
 * hiện đè lên, KHÔNG thay bằng chữ khác, để bề rộng nút không nhảy làm xô lệch hàng nút.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    pill = false,
    loading = false,
    iconLeft,
    iconRight,
    block = false,
    className = '',
    disabled,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'relative inline-flex select-none items-center justify-center font-semibold',
        'transition-[transform,background-color,color,box-shadow,opacity] duration-150 ease-out',
        'active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-ink/15',
        pill ? 'rounded-full' : 'rounded-xl',
        block ? 'w-full' : '',
        SIZES[size],
        VARIANTS[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
        </span>
      )}
      <span className={`inline-flex items-center ${SIZES[size].split(' ').pop()} ${loading ? 'opacity-0' : ''}`}>
        {iconLeft}
        {children}
        {iconRight}
      </span>
    </button>
  );
});

export default Button;
