import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <p className="text-7xl font-bold text-slate-300">403</p>
      <h1 className="text-xl font-semibold text-slate-800">Bạn không có quyền truy cập trang này</h1>
      <p className="max-w-sm text-sm text-slate-500">
        Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.
      </p>
      <button
        type="button"
        onClick={() => navigate(ROUTES.HOME)}
        className="mt-3 min-h-11 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Về trang chủ
      </button>
    </div>
  );
}
