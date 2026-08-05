import axios from 'axios';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import EventStatusBadge, { type EventStatus } from '../../../components/common/EventStatusBadge';
import { useToast } from '../../../components/common/Toast';
import { ROUTES } from '../../../constants/routes';
import { selectUser } from '../../../stores/slices/authSlice';
import { useAppSelector } from '../../../stores/store';
import { changeEventStatus } from '../eventsApi';
import type { EventDetail } from '../eventsTypes';

export default function EventDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState<EventDetail | null>((location.state as EventDetail | null) ?? null);
  const [pendingStatus, setPendingStatus] = useState<EventStatus | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const user = useAppSelector(selectUser);
  const { showToast } = useToast();

  const canManageEvent = event !== null && (user?.role === 'ROLE_ADMIN' || user?.username === event.createdBy);

  const handleChangeStatus = async () => {
    if (!event || !pendingStatus || isChangingStatus) return;

    setIsChangingStatus(true);
    try {
      const updatedEvent = await changeEventStatus(event.id, { status: pendingStatus });
      setEvent(updatedEvent);
      setPendingStatus(null);
      showToast(
        pendingStatus === 'CANCELLED' ? 'Huỷ sự kiện thành công' : 'Đóng sự kiện thành công',
        'success',
      );
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      showToast(message ?? 'Không thể cập nhật trạng thái sự kiện', 'error');
    } finally {
      setIsChangingStatus(false);
    }
  };

  if (!event) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Chi tiết sự kiện</p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Không tìm thấy thông tin sự kiện</h1>
          <p className="mt-2 text-sm text-slate-500">Vui lòng tạo lại sự kiện hoặc quay lại trang trước.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate(ROUTES.EVENT_CREATE)}
              className="inline-flex justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Tạo sự kiện mới
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.HOME)}
              className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDateTime = (value: string | undefined) => value?.replace('T', ' ') ?? 'Không xác định';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Sự kiện vừa tạo</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-900">{event.name}</h1>
            </div>
            <EventStatusBadge status={event.status} />
          </div>

          {canManageEvent && event.status === 'OPEN' && (
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingStatus('CLOSED')}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng sự kiện
              </button>
              <button
                type="button"
                onClick={() => setPendingStatus('CANCELLED')}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Huỷ sự kiện
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loại sự kiện</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{event.categoryName || 'Không xác định'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sức chứa</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{event.capacity}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thời gian</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(event.startAt)}</p>
              <p className="mt-1 text-sm text-slate-600">đến {formatDateTime(event.endAt)}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Địa điểm</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{event.location}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-700">Mô tả</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{event.description || 'Chưa có mô tả cho sự kiện này.'}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500">Người tạo</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{event.createdBy}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500">Thời gian tạo</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{event.createdAt ? event.createdAt.replace('T', ' ') : 'Không xác định'}</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingStatus !== null}
        title={pendingStatus === 'CANCELLED' ? 'Xác nhận huỷ sự kiện' : 'Xác nhận đóng sự kiện'}
        message={
          pendingStatus === 'CANCELLED'
            ? `Huỷ sự kiện '${event.name}'? Người đã đăng ký sẽ không thể tham dự.`
            : `Đóng sự kiện '${event.name}'? Sự kiện sẽ ngừng nhận đăng ký mới.`
        }
        confirmLabel={pendingStatus === 'CANCELLED' ? 'Huỷ sự kiện' : 'Đóng sự kiện'}
        onConfirm={handleChangeStatus}
        onCancel={() => setPendingStatus(null)}
        loading={isChangingStatus}
      />
    </div>
  );
}
