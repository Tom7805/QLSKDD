import { useEffect, useRef, useState, type ComponentType } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../common/ConfirmDialog';
import {
  CalendarIcon,
  ChartIcon,
  ChevronDownIcon,
  HomeIcon,
  KeyIcon,
  LogoutIcon,
  PanelLeftIcon,
  SearchIcon,
  ShieldUserIcon,
  TagIcon,
  TicketIcon,
  UserCircleIcon,
  UsersIcon,
} from '../common/Icons';
import Avatar from '../ui/Avatar';
import { useToast } from '../common/Toast';
import { ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { logout, selectRole, selectUser } from '../../stores/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../stores/store';

interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  /** Không khai báo allow = ai đăng nhập cũng thấy được mục này */
  allow?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Menu chính',
    items: [
      { label: 'Trang chủ', to: ROUTES.HOME, icon: HomeIcon },
      { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: ChartIcon, allow: ['ROLE_ADMIN', 'ROLE_ORGANIZER'] },
      { label: 'Danh sách sự kiện', to: ROUTES.EVENTS, icon: CalendarIcon },
      { label: 'Sự kiện của tôi', to: ROUTES.MY_REGISTRATIONS, icon: TicketIcon },
    ],
  },
  {
    title: 'Quản lý',
    items: [
      { label: 'Người tham gia', to: ROUTES.PARTICIPANTS, icon: UsersIcon, allow: ['ROLE_ADMIN', 'ROLE_ORGANIZER'] },
      { label: 'Loại sự kiện', to: ROUTES.CATEGORIES, icon: TagIcon, allow: ['ROLE_ADMIN'] },
      { label: 'Người dùng', to: ROUTES.USERS, icon: ShieldUserIcon, allow: ['ROLE_ADMIN'] },
    ],
  },
  {
    title: 'Tài khoản',
    items: [
      { label: 'Hồ sơ của tôi', to: ROUTES.PROFILE, icon: UserCircleIcon },
      { label: 'Đổi mật khẩu', to: ROUTES.CHANGE_PASSWORD, icon: KeyIcon },
    ],
  },
];

function AppLogo() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white shadow-sm"
      aria-hidden="true"
    >
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
        <path d="M7 5v14M12 8v8M17 5v14" />
      </svg>
    </span>
  );
}

/**
 * Ô tìm nhanh: gõ rồi Enter là nhảy sang trang danh sách sự kiện với từ khoá đã điền.
 * Cố ý ghi rõ "Tìm sự kiện" chứ không phải "tìm mọi thứ" — hệ thống mới chỉ có tìm kiếm
 * cho sự kiện, đặt kỳ vọng đúng với những gì bấm vào sẽ nhận được.
 */
function SidebarSearch({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const keyword = value.trim();
    onNavigate();
    navigate(keyword ? `${ROUTES.EVENTS}?view=list&keyword=${encodeURIComponent(keyword)}` : ROUTES.EVENTS);
    setValue('');
  };

  return (
    <form onSubmit={submit} className="px-3 pb-2" role="search">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Tìm sự kiện…"
          aria-label="Tìm sự kiện"
          className="h-10 w-full rounded-xl border border-hairline bg-slate-50/70 pl-9 pr-3 text-[13px] text-ink outline-none transition-all duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:border-ink/25 focus:bg-white focus:ring-4 focus:ring-ink/5"
        />
      </div>
    </form>
  );
}

function SidebarLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate: () => void }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === ROUTES.HOME}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          'group relative flex items-center rounded-xl text-[13.5px] font-semibold',
          'transition-all duration-150 active:scale-[0.98]',
          collapsed ? 'h-10 w-10 justify-center' : 'h-10 gap-2.5 px-3',
          isActive
            ? 'bg-slate-100 text-ink'
            : 'text-ink-muted hover:bg-slate-50 hover:text-ink',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {/* Vạch chỉ báo bên trái cho mục đang mở — nhận ra ngay cả khi liếc nhanh */}
          {isActive && !collapsed && (
            <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-ink" aria-hidden="true" />
          )}
          <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-ink' : 'text-slate-400 group-hover:text-ink'}`} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

/**
 * Thẻ tài khoản neo ở đáy sidebar (thay cho menu người dùng ở góc phải thanh trên cũ):
 * avatar chữ cái đầu + tên + vai trò, bấm vào mở menu bật LÊN TRÊN vì thẻ đã nằm sát đáy.
 */
function AccountCard({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = useAppSelector(selectUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi bấm ra ngoài hoặc nhấn Esc — menu neo trong luồng bố cục (không phải
  // overlay toàn màn) nên cần tự xử lý, không dùng lớp phủ như menu cũ ở thanh trên.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  const handleConfirmLogout = async () => {
    setConfirmOpen(false);
    await dispatch(logout());
    showToast('Đã đăng xuất', 'success');
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div ref={containerRef} className="relative">
      {menuOpen && (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onNavigate();
              navigate(ROUTES.PROFILE);
            }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <UserCircleIcon className="h-4 w-4 text-slate-400" />
            Hồ sơ của tôi
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onNavigate();
              navigate(ROUTES.CHANGE_PASSWORD);
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <KeyIcon className="h-4 w-4 text-slate-400" />
            Đổi mật khẩu
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setConfirmOpen(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogoutIcon className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={collapsed ? `${user.fullName} — ${roleLabel}` : undefined}
        className={[
          'flex w-full items-center rounded-2xl border transition-all duration-150 hover:border-slate-300 hover:shadow-card',
          collapsed ? 'justify-center border-transparent p-1.5' : 'gap-2.5 border-hairline p-2',
          menuOpen ? 'border-slate-300 shadow-card' : '',
        ].join(' ')}
      >
        <Avatar name={user.fullName} avatar={user.avatar} size="sm" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold leading-tight text-ink">{user.fullName}</span>
              <span className="block truncate text-xs leading-tight text-slate-500">{roleLabel}</span>
            </span>
            <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất?"
        confirmLabel="Đăng xuất"
        cancelLabel="Huỷ"
        onConfirm={handleConfirmLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Trên mobile sidebar là ngăn kéo trượt ra, do MainLayout điều khiển */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const role = useAppSelector(selectRole);
  const navigate = useNavigate();

  // Lọc theo quyền trước khi render để tiêu đề nhóm tự ẩn khi nhóm không còn mục nào
  // (vd: người dùng thường không thấy nhóm "Quản lý")
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.allow || (role !== null && item.allow.includes(role))),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Lớp phủ của ngăn kéo mobile */}
      <button
        type="button"
        aria-label="Đóng menu"
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={[
          'z-50 flex shrink-0 flex-col overflow-hidden bg-white',
          // Trên desktop là một tấm bo tròn riêng, tách khỏi vùng nội dung bằng khe hở
          'lg:rounded-[24px] lg:shadow-shell',
          'fixed inset-y-0 left-0 w-[268px] transition-transform duration-300',
          'lg:static lg:translate-x-0 lg:transition-[width] lg:duration-300 lg:ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[76px]' : 'lg:w-[268px]',
        ].join(' ')}
      >
        <div className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center px-3' : 'justify-between px-4'}`}>
          {collapsed ? (
            <AppLogo />
          ) : (
            <span className="flex min-w-0 items-center gap-2.5">
              <AppLogo />
              <span className="truncate text-[15px] font-extrabold tracking-tight text-ink">QLSK_DD</span>
            </span>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Thu gọn menu"
              className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-150 hover:bg-slate-50 hover:text-ink active:scale-95 lg:flex"
            >
              <PanelLeftIcon className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>

        {collapsed ? (
          <>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Mở rộng menu"
              className="mx-auto mb-1 hidden h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-ink lg:flex"
            >
              <PanelLeftIcon className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.EVENTS)}
              aria-label="Tìm sự kiện"
              className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-hairline text-slate-400 transition-all duration-150 hover:border-slate-300 hover:text-ink active:scale-95"
            >
              <SearchIcon className="h-[18px] w-[18px]" />
            </button>
          </>
        ) : (
          <SidebarSearch onNavigate={onCloseMobile} />
        )}

        <nav
          aria-label="Điều hướng chính"
          className={`min-h-0 flex-1 space-y-5 overflow-y-auto pb-4 scrollbar-slim ${collapsed ? 'px-3' : 'px-3'}`}
        >
          {sections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {section.title}
                </p>
              )}
              <div className={`space-y-0.5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
                {section.items.map((item) => (
                  <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={`shrink-0 pb-4 pt-2 ${collapsed ? 'px-3' : 'px-3'}`}>
          <AccountCard collapsed={collapsed} onNavigate={onCloseMobile} />
        </div>
      </aside>
    </>
  );
}
