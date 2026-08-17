import type { EventSummary } from '../eventsTypes';

/* --------------------------------- Màu sắc --------------------------------- */

export interface CalendarPalette {
  /** Nền khối sự kiện trên lưới tuần */
  block: string;
  /** Viền trái đậm màu để khối vẫn phân biệt được khi nền rất nhạt */
  bar: string;
  text: string;
  meta: string;
  chip: string;
  dot: string;
  /** Nền ĐẶC của thanh sự kiện trên timeline — chữ trắng nằm trên nền này */
  pill: string;
  /**
   * Dải chuyển sắc của thanh sự kiện: hai–ba sắc CÙNG HỌ chạy từ trái sang phải.
   *
   * Dùng chuyển sắc thay vì một màu phẳng vì thanh trên lịch thường rất dài — một khối
   * màu phẳng dài 400px trông chết cứng, còn chuyển sắc thì mắt đọc ra được chiều dài.
   * Vẫn giữ cùng họ màu để thanh nào thuộc loại nào thì nhận ra ngay.
   */
  gradient: string;
  /** Bóng đổ cùng tông với thanh, để thanh trông "nổi" khỏi lưới thay vì dán phẳng */
  glow: string;
}

/**
 * Bảng màu pastel cho khối sự kiện. Không ghép lớp động kiểu `bg-${x}-100` vì Tailwind
 * quét class tĩnh lúc build sẽ không sinh ra chúng.
 */
/*
 * Thứ tự các sắc được xếp sao cho HAI loại đầu tiên tương phản mạnh nhất (tím ↔ hổ phách),
 * rồi mới tới các sắc gần nhau hơn. Hệ thống thường chỉ có 2–3 loại sự kiện, nên nếu xếp
 * tím rồi lam ngay cạnh nhau thì cả bảng chỉ thấy hai sắc lạnh na ná — đúng cái đơn điệu
 * cần tránh.
 */
const CATEGORY_PALETTE: CalendarPalette[] = [
  {
    block: 'bg-violet-100 hover:bg-violet-200/80', bar: 'bg-violet-500', text: 'text-violet-950', meta: 'text-violet-700/75',
    chip: 'bg-violet-200/70 text-violet-900', dot: 'bg-violet-500',
    pill: 'bg-violet-500 hover:bg-violet-600', gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    glow: 'shadow-violet-500/45',
  },
  {
    block: 'bg-amber-100 hover:bg-amber-200/80', bar: 'bg-amber-500', text: 'text-amber-950', meta: 'text-amber-700/75',
    chip: 'bg-amber-200/70 text-amber-900', dot: 'bg-amber-500',
    pill: 'bg-amber-500 hover:bg-amber-600', gradient: 'from-amber-400 via-orange-500 to-rose-500',
    glow: 'shadow-amber-500/45',
  },
  {
    block: 'bg-sky-100 hover:bg-sky-200/80', bar: 'bg-sky-500', text: 'text-sky-950', meta: 'text-sky-700/75',
    chip: 'bg-sky-200/70 text-sky-900', dot: 'bg-sky-500',
    pill: 'bg-sky-500 hover:bg-sky-600', gradient: 'from-sky-500 via-cyan-500 to-teal-400',
    glow: 'shadow-sky-500/45',
  },
  {
    block: 'bg-emerald-100 hover:bg-emerald-200/80', bar: 'bg-emerald-500', text: 'text-emerald-950', meta: 'text-emerald-700/75',
    chip: 'bg-emerald-200/70 text-emerald-900', dot: 'bg-emerald-500',
    pill: 'bg-emerald-500 hover:bg-emerald-600', gradient: 'from-emerald-500 via-green-500 to-lime-400',
    glow: 'shadow-emerald-500/45',
  },
  {
    block: 'bg-rose-100 hover:bg-rose-200/80', bar: 'bg-rose-500', text: 'text-rose-950', meta: 'text-rose-700/75',
    chip: 'bg-rose-200/70 text-rose-900', dot: 'bg-rose-500',
    pill: 'bg-rose-500 hover:bg-rose-600', gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    glow: 'shadow-rose-500/45',
  },
  {
    block: 'bg-indigo-100 hover:bg-indigo-200/80', bar: 'bg-indigo-500', text: 'text-indigo-950', meta: 'text-indigo-700/75',
    chip: 'bg-indigo-200/70 text-indigo-900', dot: 'bg-indigo-500',
    pill: 'bg-indigo-500 hover:bg-indigo-600', gradient: 'from-indigo-500 via-blue-500 to-sky-400',
    glow: 'shadow-indigo-500/45',
  },
  {
    block: 'bg-teal-100 hover:bg-teal-200/80', bar: 'bg-teal-500', text: 'text-teal-950', meta: 'text-teal-700/75',
    chip: 'bg-teal-200/70 text-teal-900', dot: 'bg-teal-500',
    pill: 'bg-teal-500 hover:bg-teal-600', gradient: 'from-teal-500 via-emerald-500 to-lime-400',
    glow: 'shadow-teal-500/45',
  },
  {
    block: 'bg-fuchsia-100 hover:bg-fuchsia-200/80', bar: 'bg-fuchsia-500', text: 'text-fuchsia-950', meta: 'text-fuchsia-700/75',
    chip: 'bg-fuchsia-200/70 text-fuchsia-900', dot: 'bg-fuchsia-500',
    pill: 'bg-fuchsia-500 hover:bg-fuchsia-600', gradient: 'from-fuchsia-500 via-pink-500 to-orange-400',
    glow: 'shadow-fuchsia-500/45',
  },
];

const NO_CATEGORY_PALETTE: CalendarPalette = {
  block: 'bg-slate-100 hover:bg-slate-200', bar: 'bg-slate-400', text: 'text-slate-900', meta: 'text-slate-500',
  chip: 'bg-slate-200 text-slate-700', dot: 'bg-slate-400',
  pill: 'bg-slate-500 hover:bg-slate-600', gradient: 'from-slate-500 via-slate-400 to-slate-500',
  glow: 'shadow-slate-500/40',
};

// Sự kiện đã huỷ luôn xám bất kể loại — trạng thái quan trọng hơn phân loại về mặt thị giác
const CANCELLED_PALETTE: CalendarPalette = {
  block: 'bg-slate-100/70 hover:bg-slate-200/70', bar: 'bg-slate-300', text: 'text-slate-400 line-through', meta: 'text-slate-400',
  chip: 'bg-slate-200 text-slate-500', dot: 'bg-slate-300',
  pill: 'bg-slate-300 hover:bg-slate-400', gradient: 'from-slate-300 via-slate-300 to-slate-400',
  glow: 'shadow-slate-400/30',
};

/**
 * Ánh xạ id loại sự kiện -> vị trí trong bảng màu. Dùng THỨ TỰ trong danh sách loại chứ
 * không phải `id % 8`: hệ thống thường chỉ có vài loại nhưng id có thể là 5, 13, 21 —
 * lấy dư sẽ dồn chúng vào cùng một màu. Theo thứ tự thì mấy loại đầu chắc chắn khác màu.
 */
export function buildCategoryOrder(categories: Array<{ id: number }>): Map<number, number> {
  return new Map(categories.map((category, index) => [category.id, index]));
}

export function paletteFor(
  event: Pick<EventSummary, 'status' | 'categoryId'>,
  categoryOrder?: Map<number, number>,
): CalendarPalette {
  if (event.status === 'CANCELLED') return CANCELLED_PALETTE;
  if (event.categoryId == null) return NO_CATEGORY_PALETTE;
  const index = categoryOrder?.get(event.categoryId) ?? event.categoryId;
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

/** Màu chấm của một loại — dùng cho chip lọc và vạch màu ở thẻ danh sách */
export function categoryDotClass(categoryId: number, categoryOrder?: Map<number, number>) {
  const index = categoryOrder?.get(categoryId) ?? categoryId;
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length].dot;
}

/* ------------------------------- Ngày / tuần ------------------------------- */

export function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay(): 0 = Chủ nhật -> lùi 6 ngày để tuần bắt đầu từ Thứ 2
  const offset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - offset);
  return result;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** yyyy-MM-dd theo giờ ĐỊA PHƯƠNG (toISOString sẽ lệch ngày vì quy đổi sang UTC) */
export function toDateParam(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export const formatHhMm = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export function formatMonthTitle(monthStart: Date) {
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(monthStart);
}

export const DAY_LABELS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/* --------------------------------- Bộ lọc --------------------------------- */

export interface EventFilterValue {
  categoryId: string;
  status: string;
  from: string;
  to: string;
}

/* ------------------------------ Mốc thời gian ------------------------------ */

export function parseEventDates(event: EventSummary) {
  const start = new Date(event.startAt);
  const rawEnd = new Date(event.endAt);
  if (Number.isNaN(start.getTime())) return null;
  // Dữ liệu lỗi (kết thúc trước khi bắt đầu / thiếu) — coi như kéo dài 1 tiếng
  const end = !Number.isNaN(rawEnd.getTime()) && rawEnd > start
    ? rawEnd
    : new Date(start.getTime() + 60 * 60000);
  return { start, end };
}

/* --------------------------- Trạng thái theo thời gian --------------------------- */

/** Đã diễn ra xong hay chưa — dùng để làm mờ dòng trên bảng và gạch tên trong lịch trình */
export function isEventFinished(event: EventSummary, now: Date) {
  const dates = parseEventDates(event);
  return dates !== null && dates.end.getTime() < now.getTime();
}
