import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">QLSK_DD</h1>
          <p className="mt-1 text-sm text-slate-500">Đăng nhập để tiếp tục quản lý sự kiện</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
