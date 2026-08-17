import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarIcon, ChevronRightIcon, SearchIcon } from '../common/Icons';
import { ROUTES } from '../../constants/routes';

/**
 * Nhãn hiển thị trên breadcrumb theo route. Khớp theo tiền tố nên các trang con của
 * sự kiện (/events/12, /events/12/check-in...) vẫn nhận đúng nhánh "Sự kiện".
 * Xếp mục cụ thể trước mục tổng quát để tiền tố dài hơn được chọn.
 */
const BREADCRUMBS: Array<{ match: (path: string) => boolean; trail: string[] }> = [
  { match: (p) => p === ROUTES.HOME, trail: ['Trang chủ'] },
  { match: (p) => p === ROUTES.DASHBOARD, trail: ['Dashboard'] },
  { match: (p) => p === ROUTES.CHANGE_PASSWORD, trail: ['Tài khoản', 'Đổi mật khẩu'] },
  { match: (p) => p === ROUTES.MY_REGISTRATIONS, trail: ['Sự kiện của tôi'] },
  { match: (p) => p === ROUTES.PARTICIPANTS, trail: ['Quản lý', 'Người tham gia'] },
  { match: (p) => p === ROUTES.CATEGORIES, trail: ['Quản lý', 'Loại sự kiện'] },
  { match: (p) => p === ROUTES.USERS, trail: ['Quản lý', 'Người dùng'] },
  { match: (p) => p === ROUTES.EVENT_CREATE, trail: ['Sự kiện', 'Tạo mới'] },
  { match: (p) => /^\/events\/\d+\/edit$/.test(p), trail: ['Sự kiện', 'Chỉnh sửa'] },
  { match: (p) => /^\/events\/\d+\/registrations$/.test(p), trail: ['Sự kiện', 'Danh sách đăng ký'] },
  { match: (p) => /^\/events\/\d+\/check-in$/.test(p), trail: ['Sự kiện', 'Điểm danh'] },
  { match: (p) => /^\/events\/\d+\/attendance$/.test(p), trail: ['Sự kiện', 'Danh sách tham dự'] },
  { match: (p) => /^\/events\/\d+$/.test(p), trail: ['Sự kiện', 'Chi tiết'] },
  { match: (p) => p === ROUTES.EVENTS, trail: ['Sự kiện'] },
];

function HamburgerIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const trail = BREADCRUMBS.find((entry) => entry.match(pathname))?.trail ?? ['QLSK_DD'];
  const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date());

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu"
          className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink lg:hidden"
        >
          <HamburgerIcon />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          {trail.map((label, index) => {
            const isLast = index === trail.length - 1;
            return (
              <span key={label} className="flex min-w-0 items-center gap-1.5">
                {index > 0 && <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
                <span className={isLast ? 'truncate font-semibold text-ink' : 'hidden shrink-0 text-slate-400 sm:inline'}>
                  {label}
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-2 rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-semibold capitalize text-slate-500 md:inline-flex">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          {today}
        </span>
        <button
          type="button"
          onClick={() => navigate(ROUTES.EVENTS)}
          aria-label="Tìm kiếm sự kiện"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
        >
          <SearchIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
