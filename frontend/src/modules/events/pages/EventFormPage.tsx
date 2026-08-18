import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from '../../../components/common/Icons';
import { ROUTES } from '../../../constants/routes';
import EventForm from '../components/EventForm';
import { getEventById } from '../eventsApi';
import type { EventDetail } from '../eventsTypes';

export default function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id !== undefined;
  const eventId = Number(id);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const handleDirtyChange = useCallback((value: boolean) => setDirty(value), []);

  useEffect(() => {
    if (!isEditing) return;
    if (!Number.isInteger(eventId) || eventId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let active = true;
    getEventById(eventId)
      .then((data) => { if (active) setEvent(data); })
      .catch((error: unknown) => {
        if (!active) return;
        if (axios.isAxiosError(error) && error.response?.status === 404) setNotFound(true);
        else setLoadError('Không thể tải thông tin sự kiện. Vui lòng thử lại.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [eventId, isEditing]);

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeUnload = (browserEvent: BeforeUnloadEvent) => {
      browserEvent.preventDefault();
      browserEvent.returnValue = '';
    };
    const warnBeforeLinkNavigation = (clickEvent: MouseEvent) => {
      const target = clickEvent.target as Element | null;
      const link = target?.closest('a[href]');
      if (!link || window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?')) return;
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    document.addEventListener('click', warnBeforeLinkNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
      document.removeEventListener('click', warnBeforeLinkNavigation, true);
    };
  }, [dirty]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-6 p-6" aria-label="Đang tải sự kiện">
        <div className="h-9 w-72 rounded bg-slate-200" />
        <div className="h-[28rem] rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-full bg-scene p-6">
        <div className="mx-auto max-w-xl glass-card border-rose-200/80 p-8 text-center">
          <p className="text-sm font-semibold text-ink">404</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Không tìm thấy sự kiện</h1>
          <p className="mt-2 text-sm text-slate-500">Sự kiện không tồn tại hoặc đã bị xóa.</p>
          <button type="button" onClick={() => navigate(ROUTES.HOME)} className="mt-6 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return <div role="alert" className="m-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{loadError}</div>;
  }

  return (
    <div className="min-h-full bg-scene p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/*
          * Lối quay lại đặt ở ĐẦU trang, nơi người dùng theo phản xạ tìm khi muốn thoát —
          * nút "Huỷ" nằm cuối form, phải cuộn hết trang mới thấy.
          *
          * Dùng <Link> chứ không phải <button>: EventFormPage đã có sẵn bộ chặn cảnh báo
          * "thay đổi chưa lưu" bắt theo cú bấm vào thẻ <a>, nên dùng Link là tự động được
          * bảo vệ, không phải viết lại logic xác nhận.
          */}
        <Link
          to={isEditing ? ROUTES.EVENT_DETAIL.replace(':id', String(eventId)) : ROUTES.EVENTS}
          className="mb-5 inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 -ml-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-white/70 hover:text-ink"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          {isEditing ? 'Quay lại chi tiết sự kiện' : 'Quay lại danh sách sự kiện'}
        </Link>

        <div className="mb-8">
          <p className="text-sm font-medium text-ink">Quản trị sự kiện</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{isEditing ? 'Sửa sự kiện' : 'Tạo sự kiện mới'}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isEditing ? 'Cập nhật thông tin sự kiện và lưu thay đổi.' : 'Nhập thông tin chi tiết sự kiện để mở đăng ký.'}
          </p>
        </div>
        <EventForm initialEvent={event ?? undefined} onDirtyChange={handleDirtyChange} />
      </div>
    </div>
  );
}
