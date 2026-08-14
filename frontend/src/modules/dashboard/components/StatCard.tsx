import { type ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
}

export default function StatCard({ label, value, icon, loading }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        {loading ? (
          <div className="mt-1 h-7 w-3/4 animate-pulse rounded bg-slate-200" />
        ) : (
          <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums break-all">{value}</p>
        )}
      </div>
    </div>
  );
}
