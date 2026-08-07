import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import EventStatusBadge, { type EventStatus } from '../../../components/common/EventStatusBadge';
import { useToast } from '../../../components/common/Toast';
import { ROUTES } from '../../../constants/routes';
import { selectUser } from '../../../stores/slices/authSlice';
import { useAppSelector } from '../../../stores/store';
import { registerForEvent } from '../../registrations/registrationsApi';
import { changeEventStatus, getEventById } from '../eventsApi';
import type { EventDetail } from '../eventsTypes';

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const { showToast } = useToast();
  const eventId = Number(id);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingStatus, setPendingStatus] = useState<EventStatus | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(eventId) || eventId <= 0) {
      setError('Không tìm thấy sự kiện.');
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    getEventById(eventId)
      .then((data) => active && setEvent(data))
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message : undefined;
        setError(message ?? 'Không thể tải thông tin sự kiện.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [eventId, reloadKey]);

  const canManageEvent = event !== null && (user?.role === 'ROLE_ADMIN' || (user?.role === 'ROLE_ORGANIZER' && user.username === event.createdBy));
  const eventEnded = event !== null && new Date(event.endAt).getTime() < Date.now();
  const registrationDisabledReason = !user
    ? 'Vui lòng đăng nhập để đăng ký tham gia'
    : isRegistered
      ? 'Bạn đã đăng ký sự kiện này'
      : event?.status !== 'OPEN'
        ? 'Sự kiện đã đóng đăng ký'
        : eventEnded
          ? 'Sự kiện đã diễn ra'
          : (event?.availableSeats ?? 0) <= 0
            ? 'Sự kiện đã hết chỗ'
            : null;
  const canRegister = Boolean(user?.role === 'ROLE_USER' && !isRegistered && event?.status === 'OPEN' && !eventEnded && (event?.availableSeats ?? 0) > 0);

  const handleChangeStatus = async () => {
    if (!event || !pendingStatus || isChangingStatus) return;
    setIsChangingStatus(true);
    try {
      await changeEventStatus(event.id, { status: pendingStatus });
      showToast(pendingStatus === 'CANCELLED' ? 'Huỷ sự kiện thành công' : 'Đóng sự kiện thành công', 'success');
      setPendingStatus(null);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      const message = axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message : undefined;
      showToast(message ?? 'Không thể cập nhật trạng thái sự kiện', 'error');
    } finally {
      setIsChangingStatus(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-7xl animate-pulse space-y-5 p-6" aria-label="Đang tải chi tiết sự kiện"><div className="h-10 w-2/3 rounded bg-slate-200" /><div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]"><div className="h-96 rounded-2xl bg-slate-200" /><div className="h-72 rounded-2xl bg-slate-200" /></div></div>;

  if (error || !event) return <div className="p-6"><div role="alert" className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><p className="font-semibold text-red-700">{error ?? 'Không tìm thấy sự kiện.'}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-4 font-semibold text-blue-700">Thử lại</button></div></div>;

  const registered = event.totalRegistered ?? Math.max(0, event.capacity - (event.availableSeats ?? event.capacity));
  const usagePercent = event.capacity > 0 ? Math.min(100, Math.round((registered / event.capacity) * 100)) : 0;

  const handleRegister = async () => {
    if (!event || isRegistering) return;

    if (!user) {
      setLoginPromptOpen(true);
      return;
    }

    if (!canRegister) return;

    setIsRegistering(true);
    try {
      const data = await registerForEvent(event.id);
      setIsRegistered(true);
      showToast(`Đăng ký thành công! Mã vé của bạn: ${data.code}`, 'success');
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      const errorCode = axios.isAxiosError<{ errorCode?: string; message?: string }>(requestError)
        ? requestError.response?.data?.errorCode
        : undefined;
      const message = axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message : undefined;
      const friendlyMessage = errorCode === 'OVERBOOKING'
        ? 'Sự kiện đã hết chỗ'
        : errorCode === 'DUPLICATE_REGISTRATION'
          ? 'Bạn đã đăng ký sự kiện này'
          : errorCode === 'EVENT_CLOSED'
            ? 'Sự kiện đã đóng đăng ký'
            : errorCode === 'EVENT_ENDED'
              ? 'Sự kiện đã diễn ra'
              : message ?? 'Không thể đăng ký tham gia sự kiện';

      if (errorCode === 'DUPLICATE_REGISTRATION') {
        setIsRegistered(true);
      }

      showToast(friendlyMessage, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={() => navigate(ROUTES.EVENTS)} className="mb-5 text-sm font-semibold text-blue-700">← Danh sách sự kiện</button>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-start">
          <main className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-sm font-semibold text-blue-600">{event.categoryName || 'Sự kiện'}</p><h1 className="mt-1 text-3xl font-bold text-slate-900">{event.name}</h1></div>
              <EventStatusBadge status={event.status} />
            </div>
            <dl className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold uppercase text-slate-400">Bắt đầu</dt><dd className="mt-1 font-medium text-slate-800">{formatDateTime(event.startAt)}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold uppercase text-slate-400">Kết thúc</dt><dd className="mt-1 font-medium text-slate-800">{formatDateTime(event.endAt)}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2"><dt className="text-xs font-semibold uppercase text-slate-400">Địa điểm</dt><dd className="mt-1 font-medium text-slate-800">{event.location}</dd></div>
            </dl>
            <section className="mt-6"><h2 className="font-semibold text-slate-900">Mô tả</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{event.description || 'Chưa có mô tả cho sự kiện này.'}</p></section>
            <section className="mt-7 rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">Số chỗ đã đăng ký</span><span className="text-slate-600">{registered}/{event.capacity}</span></div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${usagePercent}%` }} /></div>
              <p className="mt-2 text-xs text-slate-500">Còn {event.availableSeats ?? Math.max(0, event.capacity - registered)} chỗ</p>
            </section>
          </main>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-slate-900">Thao tác</h2>
            <p className="mt-1 text-sm text-slate-500">Người tổ chức: {event.createdBy}</p>
            <div className="mt-5 flex flex-col gap-3">
              {user?.role === 'ROLE_USER' && (
                <>
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={!canRegister || isRegistering}
                    className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isRegistering ? 'Đang xử lý...' : isRegistered ? 'Đã đăng ký' : 'Đăng ký tham gia'}
                  </button>
                  {registrationDisabledReason && <p className="text-sm text-slate-500">{registrationDisabledReason}</p>}
                </>
              )}
              {canManageEvent && <>
                <button type="button" onClick={() => navigate(ROUTES.EVENT_EDIT.replace(':id', String(event.id)))} className="min-h-11 rounded-xl border border-blue-200 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50">Sửa sự kiện</button>
                {event.status === 'OPEN' && <button type="button" onClick={() => setPendingStatus('CLOSED')} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Đóng sự kiện</button>}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.EVENT_REGISTRATIONS.replace(':eventId', String(event.id)))}
                  className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Xem người đăng ký
                </button>
                <button type="button" className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Điểm danh</button>
                {event.status === 'OPEN' && <button type="button" onClick={() => setPendingStatus('CANCELLED')} className="min-h-11 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">Huỷ sự kiện</button>}
              </>}
            </div>
          </aside>
        </div>
      </div>
      <ConfirmDialog open={pendingStatus !== null} title={pendingStatus === 'CANCELLED' ? 'Xác nhận huỷ sự kiện' : 'Xác nhận đóng sự kiện'} message={pendingStatus === 'CANCELLED' ? `Huỷ sự kiện '${event.name}'? Người đã đăng ký sẽ không thể tham dự.` : `Đóng sự kiện '${event.name}'? Sự kiện sẽ ngừng nhận đăng ký mới.`} confirmLabel={pendingStatus === 'CANCELLED' ? 'Huỷ sự kiện' : 'Đóng sự kiện'} onConfirm={handleChangeStatus} onCancel={() => setPendingStatus(null)} loading={isChangingStatus} />
      <ConfirmDialog
        open={loginPromptOpen}
        title="Đăng nhập để đăng ký"
        message="Bạn cần đăng nhập trước khi đăng ký tham gia sự kiện. Chuyển sang trang đăng nhập ngay?"
        confirmLabel="Đăng nhập"
        cancelLabel="Huỷ"
        onConfirm={() => {
          setLoginPromptOpen(false);
          navigate(ROUTES.LOGIN);
        }}
        onCancel={() => setLoginPromptOpen(false)}
      />
    </div>
  );
}
