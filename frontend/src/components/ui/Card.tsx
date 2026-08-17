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
<<<<<<< HEAD
    ? 'glass-card'
    : 'rounded-2xl border border-hairline bg-white shadow-card';
=======
    ? 'rounded-3xl border border-white/80 bg-white/95 shadow-float backdrop-blur-sm'
    : 'rounded-2xl border border-hairline/90 bg-white shadow-card';
>>>>>>> 85ff8f49043fe298082949bc3d77c59c4588f808
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
    <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-hairline/80 px-4 py-3.5 sm:px-5 ${className}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100" aria-hidden="true">
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
