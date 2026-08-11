interface AttendanceRateBarProps {
  rate: number;
  label?: string;
}

// B4.3-T4: thanh tiến độ đổi màu theo ngưỡng — <50% đỏ, 50-80% vàng, >80% xanh.
function rateColor(rate: number) {
  if (rate < 50) return { bar: 'bg-red-500', text: 'text-red-700' };
  if (rate <= 80) return { bar: 'bg-amber-500', text: 'text-amber-700' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-700' };
}

export default function AttendanceRateBar({ rate, label = 'Tỷ lệ tham dự' }: AttendanceRateBarProps) {
  const clamped = Math.min(100, Math.max(0, rate));
  const { bar, text } = rateColor(rate);

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        {label && <span className={`font-semibold ${text}`}>{label}</span>}
        <span className={`ml-auto font-semibold ${text}`}>{rate}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={rate} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Tỷ lệ tham dự'}>
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
