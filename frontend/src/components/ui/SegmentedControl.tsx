import { useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  /** Huy hiệu số nhỏ bên phải nhãn (vd: số sự kiện thuộc mốc đó) */
  badge?: ReactNode;
  hint?: string;
}

interface SegmentedControlProps<T extends string> {
  options: Array<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  /** Ẩn nhãn chữ ở màn hình hẹp, chỉ còn icon (dùng khi thanh công cụ chật) */
  compactOnMobile?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Bộ tab dạng viên thuốc dùng chung: nền xám nhạt, mục đang chọn là ô trắng nổi lên.
 *
 * Viên thuốc trắng là MỘT phần tử duy nhất đặt tuyệt đối rồi trượt sang vị trí mục được
 * chọn, thay vì mỗi nút tự bật/tắt nền — nhờ vậy chuyển tab thành một chuyển động liền
 * mạch chứ không nhảy cứng. Vị trí và bề rộng đo từ chính nút đang chọn nên các mục dài
 * ngắn khác nhau vẫn khớp.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  compactOnMobile = false,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  /*
   * Khoá phụ thuộc là chuỗi giá trị các mục, KHÔNG phải chính mảng `options`: nơi gọi
   * thường truyền mảng literal nên mảng đó là tham chiếu mới sau mỗi lần render — để
   * `options` trong deps sẽ khiến effect chạy lại vô tận.
   */
  const optionsKey = options.map((option) => `${option.value}:${option.badge ?? ''}`).join('|');

  // Đo bằng useLayoutEffect để viên thuốc đã ở đúng chỗ ngay từ khung hình đầu tiên,
  // tránh việc nó bay từ góc trái sang khi mới mở trang
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const measure = () => {
      const active = container.querySelector<HTMLElement>('[data-selected="true"]');
      if (!active) return;
      const next = { left: active.offsetLeft, width: active.offsetWidth };
      // Chỉ đặt lại state khi số đo THỰC SỰ đổi. Nếu luôn tạo object mới thì mỗi lần đo
      // là một lần re-render, kéo theo một lần đo nữa -> vòng lặp render không dừng.
      setIndicator((current) =>
        current && current.left === next.left && current.width === next.width ? current : next,
      );
    };

    measure();

    // Bề rộng nút đổi theo khổ màn hình (nhãn bị ẩn ở mobile) và theo nội dung huy hiệu.
    // ResizeObserver không có trong jsdom lẫn vài WebView cũ -> lùi về sự kiện resize.
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value, optionsKey]);

  const heights = size === 'sm' ? { outer: 'h-9', inner: 'h-7' } : { outer: 'h-10', inner: 'h-8' };

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={label}
      className={`relative inline-flex items-center rounded-xl bg-slate-100 p-1 ${heights.outer} ${className}`}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className={`absolute rounded-lg bg-white shadow-pill transition-all duration-300 ease-out ${heights.inner}`}
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}

      {options.map((option) => {
        const selected = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            data-selected={selected}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            title={option.hint}
            className={[
              'relative z-10 inline-flex items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold',
              'transition-colors duration-200 active:scale-[0.97]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/25',
              heights.inner,
              selected ? 'text-ink' : 'text-ink-muted hover:text-ink',
            ].join(' ')}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span className={compactOnMobile ? 'hidden sm:inline' : ''}>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={[
                  'rounded-full px-1.5 text-[10px] font-bold tabular-nums transition-colors duration-200',
                  selected ? 'bg-ink text-white' : 'bg-slate-200 text-ink-muted',
                ].join(' ')}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
