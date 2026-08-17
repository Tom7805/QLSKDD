import type { ReactNode } from 'react';
import type { Category } from '../../categories/categoriesTypes';
import CategoryList from './CategoryList';
import FilterChip from './FilterChip';
import type { EventFilterValue } from './calendarShared';

/** Chấm màu trùng với chú giải trạng thái ở chân bảng lịch */
const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Đang mở', dot: 'bg-emerald-500' },
  { value: 'CLOSED', label: 'Đã đóng', dot: 'bg-amber-500' },
  { value: 'CANCELLED', label: 'Đã huỷ', dot: 'bg-rose-500' },
];

const dateFieldClass =
  'h-7 min-w-0 rounded-full border border-slate-200 bg-white px-2.5 text-[12px] text-ink outline-none transition-all duration-150 hover:border-slate-300 focus:border-ink/25 focus:ring-4 focus:ring-ink/[0.07]';

interface EventFilterBarProps {
  /** Chế độ lịch lấy khoảng ngày từ thanh điều hướng; danh sách thì chọn tay */
  isCalendar: boolean;

  categories: Category[];
  categoryOrder?: Map<number, number>;
  filters: EventFilterValue;
  onFiltersChange: (value: EventFilterValue) => void;
  onClear: () => void;
  activeCount: number;
}

/**
 * Mỗi trục lọc là một thẻ riêng.
 *
 * `flex-1 basis-64` cho các thẻ tự chia đều bề rộng còn lại thay vì thẻ nào nhiều chip
 * thì phình ra — nhờ vậy hàng luôn cân, và khi màn hẹp thì cả thẻ rớt xuống nguyên khối
 * chứ không để chip của hai trục khác nhau lẫn vào cùng một dòng.
 */
function FilterBox({
  label,
  hint,
  ariaLabel,
  /** Viền màu nhạt riêng cho từng trục lọc — nhìn màu viền là biết đang ở nhóm nào */
  borderTone,
  children,
}: {
  label: string;
  hint: string;
  ariaLabel?: string;
  borderTone: string;
  children: ReactNode;
}) {
  return (
    <section
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel}
      className={`flex min-w-0 flex-1 basis-64 flex-wrap items-center gap-1.5 glass-card px-3.5 py-2.5 ${borderTone}`}
    >
      <span title={hint} className="shrink-0 cursor-help text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </section>
  );
}

/**
 * Thanh lọc dùng chung cho cả hai khung nhìn: mỗi trục một thẻ, mọi điều kiện đều là
 * chip cùng một kiểu. Chỉ khác nhau ở thẻ "Khoảng ngày" — riêng chế độ danh sách.
 *
 * KHÔNG có bộ lọc theo mốc thời gian ở đây: bảng lịch đã bày sẵn vị trí của từng sự
 * kiện so với cột hôm nay, sự kiện đã xong thì làm mờ — nhìn là biết, không cần lọc.
 */
export default function EventFilterBar({
  isCalendar,
  categories,
  categoryOrder,
  filters,
  onFiltersChange,
  onClear,
  activeCount,
}: EventFilterBarProps) {
  const update = (field: keyof EventFilterValue, value: string) => onFiltersChange({ ...filters, [field]: value });

  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-stretch gap-2">
      {categories.length > 0 && (
        <FilterBox label="Loại" hint="Phân loại sự kiện do ban tổ chức đặt" borderTone="border-violet-200/90">
          <CategoryList
            categories={categories}
            value={filters.categoryId}
            categoryOrder={categoryOrder}
            onChange={(categoryId) => update('categoryId', categoryId)}
          />
        </FilterBox>
      )}

      <FilterBox label="Đăng ký" hint="Ban tổ chức còn nhận đăng ký hay không" ariaLabel="Trạng thái đăng ký" borderTone="border-amber-200/90">
        <FilterChip selected={filters.status === ''} onClick={() => update('status', '')}>
          Tất cả
        </FilterChip>
        {STATUS_OPTIONS.map((option) => {
          const selected = filters.status === option.value;
          return (
            <FilterChip
              key={option.value}
              selected={selected}
              dot={option.dot}
              onClick={() => update('status', selected ? '' : option.value)}
            >
              {option.label}
            </FilterChip>
          );
        })}
      </FilterBox>

      {/* Chế độ lịch lấy khoảng ngày từ thanh điều hướng, chỉ danh sách mới cần chọn tay */}
      {!isCalendar && (
        <FilterBox label="Khoảng ngày" hint="Chỉ hiện sự kiện bắt đầu trong khoảng này" borderTone="border-sky-200/90">
          <input
            aria-label="Từ ngày"
            className={dateFieldClass}
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => update('from', event.target.value)}
          />
          <span className="text-[11px] text-slate-400" aria-hidden="true">→</span>
          <input
            aria-label="Đến ngày"
            className={dateFieldClass}
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => update('to', event.target.value)}
          />
        </FilterBox>
      )}

      {/* self-stretch để nút cao đúng bằng các thẻ bên cạnh, không bị lệch so le */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="flex shrink-0 items-center gap-1 self-stretch rounded-2xl border border-slate-200 bg-white px-3.5 text-[11.5px] font-bold text-ink-muted transition-all duration-150 hover:border-ink hover:bg-ink hover:text-white raise"
        >
          Xóa bộ lọc
          <span className="text-[10px] tabular-nums opacity-70">{activeCount}</span>
        </button>
      )}
    </div>
  );
}
