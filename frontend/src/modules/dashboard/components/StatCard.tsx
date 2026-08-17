import { type ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  /** Dòng phụ dưới con số — nêu ngữ cảnh có thật, không phải % tăng/giảm bịa ra */
  hint?: ReactNode;
  /** 0–100: vẽ thanh tiến độ mảnh dưới đáy thẻ (dùng cho các chỉ số dạng tỷ lệ) */
  progress?: number | null;
  progressTone?: 'emerald' | 'amber' | 'red' | 'ink';
}

const PROGRESS_TONES: Record<NonNullable<StatCardProps['progressTone']>, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  ink: 'bg-ink',
};

export default function StatCard({
  label,
  value,
  icon,
  loading,
  hint,
  progress = null,
  progressTone = 'ink',
}: StatCardProps) {
  return (
    <div className="group flex h-full flex-col rounded-3xl bg-white p-4 shadow-float transition-all duration-200 hover:-translate-y-1 hover:shadow-float-lg sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink-muted">{label}</p>
        {icon && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-ink-muted transition-colors group-hover:bg-ink group-hover:text-white"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
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
            className={`h-full rounded-full transition-[width] duration-500 ${PROGRESS_TONES[progressTone]}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
