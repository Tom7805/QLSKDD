import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

const COLLAPSE_STORAGE_KEY = 'qlskdd.sidebarCollapsed';

/**
 * Khung ứng dụng: nền xám phủ toàn màn, bên trên là HAI tấm bo tròn tách rời — sidebar
 * và vùng nội dung — cách nhau một khe hở. Tách hẳn thay vì gộp chung một khối giúp mắt
 * phân biệt ngay đâu là điều hướng, đâu là nội dung đang xem.
 *
 * Chỉ vùng nội dung cuộn (trang không cuộn) nên sidebar và thanh trên luôn đứng yên;
 * thẻ tài khoản vì thế cũng luôn nằm ở đáy sidebar.
 */
export default function MainLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Đổi trang thì đóng ngăn kéo mobile và đưa vùng nội dung về đầu — vùng cuộn là
  // <main> chứ không phải window nên window.scrollTo của trang con không lo việc này.
  useEffect(() => {
    setMobileOpen(false);
    document.getElementById('app-scroll-area')?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="relative flex h-screen gap-0 overflow-hidden bg-canvas p-0 lg:gap-3 lg:p-3">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-40 h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 right-0 h-[30rem] w-[30rem] rounded-full bg-sky-200/30 blur-3xl" />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden border-white/80 bg-white/95 shadow-shell backdrop-blur-xl lg:rounded-[26px] lg:border">
        <Topbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main id="app-scroll-area" className="min-h-0 flex-1 overflow-y-auto scrollbar-slim">
          {/*
            Đổi khoá theo pathname để mỗi lần sang trang khác là nội dung mới trồi lên
            mượt thay vì thay thế đột ngột. Chỉ theo pathname, KHÔNG theo query string —
            nếu không thì mỗi lần đổi tuần/bộ lọc trên cùng một trang cũng chạy lại
            hiệu ứng, gây chớp giật.
          */}
          <div key={pathname} className="animate-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
