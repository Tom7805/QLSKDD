import EventForm from '../components/EventForm';

export default function EventFormPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">Quản trị sự kiện</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Tạo sự kiện mới</h1>
          <p className="mt-2 text-sm text-slate-500">Nhập thông tin chi tiết sự kiện để mở đăng ký.</p>
        </div>
        <EventForm />
      </div>
    </div>
  );
}
