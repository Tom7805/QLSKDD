/**
 * Bộ icon nét mảnh dùng chung cho khung ứng dụng (sidebar, thanh trên, lịch tuần).
 * Vẽ inline bằng SVG thay vì thêm thư viện icon: dự án đã theo cách này ở EventCard/
 * EventFilter, và tránh kéo thêm ~vài chục KB phụ thuộc chỉ để lấy hơn chục hình.
 *
 * Mọi icon nhận className để gọi tự đặt kích thước/màu (mặc định h-5 w-5, ăn theo
 * currentColor) và luôn aria-hidden vì icon ở đây chỉ đi kèm nhãn chữ.
 */
interface IconProps {
  className?: string;
}

const base = (className?: string) => ({
  className: className ?? 'h-5 w-5',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-3.5V15h-5v5.5H5A1.5 1.5 0 0 1 3.5 19z" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <path d="M8 15.5v-3M12 15.5v-7M16 15.5v-5" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
      <path d="M3.5 9.5h17M8 3.5V6.5M16 3.5V6.5" />
    </svg>
  );
}

export function TicketIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v2a2 2 0 0 0 0 3.9v2.1a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2.1a2 2 0 0 0 0-3.9z" />
      <path d="M13.5 7v11" strokeDasharray="2 2.5" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="9.5" cy="8.5" r="3.25" />
      <path d="M3.75 19.5a5.75 5.75 0 0 1 11.5 0M16.5 6.2a3.25 3.25 0 0 1 0 6.1M17.5 14.2a5.2 5.2 0 0 1 3 5.3" />
    </svg>
  );
}

export function ShieldUserIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3.5 5 6v6c0 4.2 3 7.2 7 8.5 4-1.3 7-4.3 7-8.5V6z" />
      <circle cx="12" cy="10.5" r="2" />
      <path d="M8.75 16.2a3.5 3.5 0 0 1 6.5 0" />
    </svg>
  );
}

export function TagIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 11.2V5.5A1.5 1.5 0 0 1 5.5 4h5.7a2 2 0 0 1 1.42.59l7 7a2 2 0 0 1 0 2.82l-5.7 5.7a2 2 0 0 1-2.82 0l-7-7A2 2 0 0 1 4 11.2z" />
      <circle cx="8.75" cy="8.75" r="1.4" />
    </svg>
  );
}

export function KeyIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="8" cy="12" r="3.75" />
      <path d="M11.75 12H20.5M17.5 12v3M14.75 12v2.25" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="2.75" />
      <path d="M19.4 14.5a1.5 1.5 0 0 0 .3 1.65l.05.06a1.8 1.8 0 1 1-2.55 2.55l-.06-.06a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37v.16a1.8 1.8 0 1 1-3.6 0v-.09a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.06.06a1.8 1.8 0 1 1-2.55-2.55l.06-.06a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9h-.16a1.8 1.8 0 1 1 0-3.6h.09a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.06-.06A1.8 1.8 0 1 1 8.2 4.87l.06.06a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .9-1.37v-.16a1.8 1.8 0 1 1 3.6 0v.09a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.06-.06a1.8 1.8 0 1 1 2.55 2.55l-.06.06a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.9h.16a1.8 1.8 0 1 1 0 3.6h-.09a1.5 1.5 0 0 0-1.37.9z" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="10.75" cy="10.75" r="6.25" />
      <path d="m15.5 15.5 4 4" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function FilterIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4.5 6.5h15M7.5 12h9M10.5 17.5h3" />
    </svg>
  );
}

export function PanelLeftIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M10 4.5v15" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.75V12l2.75 1.75" />
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 21s-6.5-5.61-6.5-11A6.5 6.5 0 1 1 18.5 10c0 5.39-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M14.5 8.5V6.25A1.75 1.75 0 0 0 12.75 4.5h-6A1.75 1.75 0 0 0 5 6.25v11.5a1.75 1.75 0 0 0 1.75 1.75h6a1.75 1.75 0 0 0 1.75-1.75V15.5" />
      <path d="M10 12h9.5m0 0-2.75-2.75M19.5 12l-2.75 2.75" />
    </svg>
  );
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11" />
      <circle cx="4.75" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4.75" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4.75" cy="17.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Mũi tên sắp xếp cột bảng: direction null = chưa sắp theo cột này (hiện cả hai chiều mờ) */
export function SortIcon({ className, direction }: IconProps & { direction?: 'asc' | 'desc' | null }) {
  return (
    <svg {...base(className)}>
      <path d="m8 9.5 3-3 3 3" opacity={direction === 'desc' ? 0.25 : 1} />
      <path d="m8 14.5 3 3 3-3" opacity={direction === 'asc' ? 0.25 : 1} />
    </svg>
  );
}

export function TrendingUpIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m4 15.5 5-5 3.5 3.5L20 7" />
      <path d="M15 7h5v5" />
    </svg>
  );
}

export function CheckSquareIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M20.5 11.2V18a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V6A2.5 2.5 0 0 1 6 3.5h9" />
      <path d="m8.5 11.5 3 3 8-8.5" />
    </svg>
  );
}

export function UserCircleIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="10" r="2.75" />
      <path d="M6.6 18.4a6 6 0 0 1 10.8 0" />
    </svg>
  );
}

export function SparkIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M13 3 5.5 13.5H12l-1 7.5 7.5-10.5H12z" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 4v10.5m0 0 3.5-3.5M12 14.5 8.5 11" />
      <path d="M4.5 16.5V18A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5v-1.5" />
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3.75" y="3.75" width="7" height="7" rx="2" />
      <rect x="13.25" y="3.75" width="7" height="7" rx="2" />
      <rect x="3.75" y="13.25" width="7" height="7" rx="2" />
      <rect x="13.25" y="13.25" width="7" height="7" rx="2" />
    </svg>
  );
}
