import type { ReactNode } from 'react';

interface FilterChipProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Lớp nền của chấm màu bên trái (loại sự kiện / trạng thái) */
  dot?: string;
  /** Số nhỏ bên phải nhãn — cho biết bấm vào sẽ còn lại bao nhiêu sự kiện */
  badge?: number;
  title?: string;
}

/**
 * Viên chip lọc dùng chung cho cả ba nhóm bộ lọc (loại, thời gian, trạng thái).
 *
 * Cùng một hình dạng cho cả ba nhóm là chủ ý: bộ lọc chỉ có ba câu hỏi, xếp dọc thành ba
 * danh sách thì chiếm gần cả chiều cao panel trong khi mỗi câu hỏi chỉ có 3–4 lựa chọn.
 * Chip quấn dòng gói mỗi nhóm vào một hàng, và vì hình dạng giống nhau nên mắt nhận ra
 * ngay "đây đều là thứ bấm được để lọc".
 */
export default function FilterChip({ selected, onClick, children, dot, badge, title }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={title}
      className={[
        'inline-flex h-7 max-w-full items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold',
        'transition-all duration-150 active:scale-[0.97]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/25',
        selected ? 'bg-ink text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-ink',
      ].join(' ')}
    >
      {dot && <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />}
      <span className="truncate">{children}</span>
      {badge !== undefined && (
        <span className={`shrink-0 text-[10px] font-bold tabular-nums ${selected ? 'text-white/70' : 'text-slate-400'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
