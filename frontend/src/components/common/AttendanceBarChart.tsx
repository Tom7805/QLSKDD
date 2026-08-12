interface AttendanceBarChartProps {
  present: number;
  absent: number;
}

export default function AttendanceBarChart({ present, absent }: AttendanceBarChartProps) {
  const max = Math.max(present, absent, 1);
  const bars = [
    { key: 'present', label: 'Có mặt', value: present, color: 'bg-emerald-500' },
    { key: 'absent', label: 'Vắng', value: absent, color: 'bg-amber-500' },
  ] as const;

  return (
    <div
      role="img"
      aria-label={`Biểu đồ tổng hợp điểm danh: có mặt ${present}, vắng ${absent}`}
      className="flex h-36 items-end gap-8 px-2"
    >
      {bars.map((bar) => (
        <div key={bar.key} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{bar.value}</span>
          <div className="flex h-24 w-full max-w-16 items-end overflow-hidden rounded-lg bg-slate-100">
            <div
              className={`w-full rounded-lg transition-all ${bar.color}`}
              style={{ height: `${(bar.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}
