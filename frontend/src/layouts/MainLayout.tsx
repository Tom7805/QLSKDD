import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

// Bản tối giản: chỉ mount Navbar để có chỗ hiển thị nút đăng xuất (B1.2-T4).
// Sidebar/Footer đầy đủ thuộc phạm vi B0.4-T9, chưa triển khai ở đây.
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
