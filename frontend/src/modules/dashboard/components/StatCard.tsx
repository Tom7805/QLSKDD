import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../../../components/common/Icons';

/** Sắc riêng của từng thẻ: viền + nền huy hiệu biểu tượng + màu thanh tiến độ */
export type StatTone = 'indigo' | 'amber' | 'sky' | 'emerald' | 'rose';

const TONES: Record<StatTone, { border: string; chip: string; bar: string }> = {
  indigo: { border: 'border-indigo-200 hover:border-indigo-400', chip: 'bg-indigo-100 text-indigo-600', bar: 'bg-indigo-500' },
  amber: { border: 'border-amber-200 hover:border-amber-400', chip: 'bg-amber-100 text-amber-600', bar: 'bg-amber-500' },
  sky: { border: 'border-sky-200 hover:border-sky-400', chip: 'bg-sky-100 text-sky-600', bar: 'bg-sky-500' },
  emerald: { border: 'border-emerald-200 hover:border-emerald-400', chip: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-500' },
  rose: { border: 'border-rose-200 hover:border-rose-400', chip: 'bg-rose-100 text-rose-600', bar: 'bg-rose-500' },
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  /** Dòng phụ dưới con số — nêu ngữ cảnh có thật, không phải % tăng/giảm bịa ra */
  hint?: ReactNode;
  /** 0–100: vẽ thanh tiến độ mảnh dưới đáy thẻ (dùng cho các chỉ số dạng tỷ lệ) */
  progress?: number | null;
  /** Sắc của thẻ — quyết định viền, huy hiệu biểu tượng và màu thanh tiến độ mặc định */
  tone?: StatTone;
  /** Thanh tiến độ đổi màu theo NGƯỠNG (đỏ/vàng/xanh) chứ không theo sắc thẻ */
  progressTone?: 'emerald' | 'amber' | 'red';
  /** Có thì thẻ trở thành liên kết — bấm vào thẻ số liệu là mở luôn trang chi tiết */
  to?: string;
}

const PROGRESS_TONES: Record<NonNullable<StatCardProps['progressTone']>, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

/**
 * Thẻ số liệu. Mỗi thẻ mang một sắc riêng ở VIỀN và ở huy hiệu biểu tượng, còn con số
 * giữ màu mực — tô màu cả con số thì bốn thẻ cạnh nhau thành bốn khối chói, đọc mệt.
 *
 * Có `to` thì cả thẻ là một liên kết: thấy con số rồi muốn xem chi tiết là bấm ngay vào
 * thẻ, không phải đi tìm menu. Mũi tên ở góc chỉ hiện khi trỏ vào để báo thẻ bấm được.
 */
export default function StatCard({
  label,
  value,
  icon,
  loading,
  hint,
  progress = null,
  tone = 'indigo',
  progressTone,
  to,
}: StatCardProps) {
  const palette = TONES[tone];

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink-muted">{label}</p>
        <span className="flex shrink-0 items-center gap-1">
          {icon && (
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${palette.chip}`}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          {to && (
            <ChevronRightIcon
              className="h-4 w-4 text-slate-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden="true"
            />
          )}
        </span>
      </div>

      {loading ? (
        <div className="mt-3 h-9 w-2/3 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-2 break-all text-[30px] font-extrabold leading-none tracking-tight text-ink tabular-nums">
          {value}
        </p>
      )}

      {loading ? (
        <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
      ) : (
        hint && <p className="mt-2 text-xs leading-5 text-ink-muted">{hint}</p>
      )}

      {progress !== null && !loading && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${progressTone ? PROGRESS_TONES[progressTone] : palette.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </>
  );

  const shell = [
    'group flex h-full flex-col rounded-3xl border bg-white/70 p-4 shadow-raise backdrop-blur-xl sm:p-5',
    'transition-all duration-200 hover:-translate-y-1 hover:shadow-raise-lg',
    palette.border,
  ].join(' ');

  if (to) {
    return (
      <Link to={to} className={shell}>
        {body}
      </Link>
    );
  }
  return <div className={shell}>{body}</div>;
}
