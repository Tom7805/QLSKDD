import { NavLink } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';
import { ROUTES } from '../../constants/routes';

interface NavItem {
  label: string;
  to: string;
  // Không khai báo allow = ai đăng nhập cũng thấy được mục này
  allow?: string[];
}

// TODO: bổ sung thêm mục khi các trang tương ứng (sự kiện, đăng ký, điểm danh...)
// được triển khai ở các task khác.
const NAV_ITEMS: NavItem[] = [
  { label: 'Danh sách sự kiện', to: ROUTES.EVENTS },
  { label: 'Sự kiện của tôi', to: ROUTES.MY_REGISTRATIONS },
  { label: 'Trang chủ', to: ROUTES.HOME },
  { label: 'Tạo sự kiện', to: ROUTES.EVENT_CREATE, allow: ['ROLE_ADMIN', 'ROLE_ORGANIZER'] },
  { label: 'Quản lý loại sự kiện', to: ROUTES.CATEGORIES, allow: ['ROLE_ADMIN'] },
  { label: 'Quản lý người dùng', to: ROUTES.USERS, allow: ['ROLE_ADMIN'] },
];

function SidebarLink({ item }: { item: NavItem }) {
  const allowed = usePermission(item.allow ?? []);
  if (item.allow && !allowed) return null;

  return (
    <NavLink
      to={item.to}
      end={item.to === ROUTES.HOME}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm font-medium ${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-3">
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>
    </aside>
  );
}
