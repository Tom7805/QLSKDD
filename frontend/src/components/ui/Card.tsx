import type { ReactNode } from 'react';

/**
 * Thẻ nền trắng bo tròn — đơn vị bố cục cơ bản của toàn hệ thống. Dùng chung để mọi
 * trang có cùng bán kính bo, viền và bóng, thay vì mỗi nơi tự viết một bộ lớp khác nhau.
 */
export function Card({
  className = '',
  floating = false,
  children,
}: {
  className?: string;
  /** Bo tròn hơn, bỏ viền và đổ bóng sâu — dùng khi thẻ đặt trên nền màu để nổi hẳn lên */
  floating?: boolean;
  children: ReactNode;
}) {
  const base = floating
    ? 'rounded-3xl bg-white shadow-float'
    : 'rounded-2xl border border-hairline bg-white shadow-card';
  return <div className={`${base} ${className}`}>{children}</div>;
}

interface CardHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Nút/bộ lọc đặt ở mép phải của thanh tiêu đề */
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ icon, title, subtitle, actions, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 sm:px-5 ${className}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-ink-muted" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-bold text-ink">{title}</h2>
          {subtitle && <p className="truncate text-xs text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}
