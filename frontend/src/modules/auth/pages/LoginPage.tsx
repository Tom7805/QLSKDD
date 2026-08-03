import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-50 lg:p-4">
      <div className="w-full bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:max-w-[400px] lg:rounded-2xl lg:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">QLSK_DD</h1>
          <p className="mt-1 text-sm text-slate-500">Đăng nhập để tiếp tục quản lý sự kiện</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
