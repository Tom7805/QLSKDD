import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AttendanceBarChart from '../../../components/common/AttendanceBarChart';
import AttendanceRateBar from '../../../components/common/AttendanceRateBar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import EventStatusBadge, { type EventStatus } from '../../../components/common/EventStatusBadge';
import { useToast } from '../../../components/common/Toast';
import SortableGrid from '../../../components/ui/SortableGrid';
import { ROUTES } from '../../../constants/routes';
import { selectUser } from '../../../stores/slices/authSlice';
import { useAppSelector } from '../../../stores/store';
import { getAttendanceSummary } from '../../checkin/checkinApi';
import type { AttendanceSummary } from '../../checkin/checkinTypes';
import { registerForEvent } from '../../registrations/registrationsApi';
import { changeEventStatus, getEventById } from '../eventsApi';
import type { EventDetail } from '../eventsTypes';
import QrTicketModal from '../../registrations/components/QrTicketModal';
import type { RegistrationCreateResponse } from '../../registrations/registrationsTypes';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(date);
  const day = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(date);
  return `${time} ${day}`;
};

/** Khoá localStorage nhớ thứ tự hai khối của trang chi tiết */
const DETAIL_ORDER_KEY = 'qlskdd.eventDetail.blockOrder';

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
  const [newTicket, setNewTicket] = useState<RegistrationCreateResponse | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);

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
      .then((data) => {
        if (!active) return;
        setEvent(data);
        setIsRegistered(data.registered);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message : undefined;
        setError(message ?? 'Không thể tải thông tin sự kiện.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [eventId, reloadKey]);

  const canManageEvent = event !== null && (user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_ORGANIZER');

  useEffect(() => {
    if (!canManageEvent || !Number.isInteger(eventId) || eventId <= 0) return;
    let active = true;
    getAttendanceSummary(eventId)
      .then((data) => active && setAttendanceSummary(data.summary))
      .catch(() => { /* Biểu đồ chỉ là thông tin bổ sung, không chặn trang chi tiết khi lỗi. */ });
    return () => { active = false; };
  }, [canManageEvent, eventId, reloadKey]);

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

  if (error || !event) return <div className="min-h-full bg-scene p-6"><div role="alert" className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><p className="font-semibold text-red-700">{error ?? 'Không tìm thấy sự kiện.'}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-4 font-semibold text-ink">Thử lại</button></div></div>;

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
      setNewTicket(data);
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
    <div className="min-h-full bg-scene p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={() => navigate(ROUTES.EVENTS)} className="mb-5 text-sm font-semibold text-ink">← Danh sách sự kiện</button>
        {/*
          Hai khối đổi chỗ được. Bề rộng 2 + 1 trên lưới 3 cột nên dù xếp khối nào trước
          thì tổng cũng vừa đúng một hàng, và mỗi khối luôn giữ đúng bề rộng của nó.
        */}
        <SortableGrid
          storageKey={DETAIL_ORDER_KEY}
          ariaLabel="Các khối của trang chi tiết sự kiện"
          className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start"
          blocks={[
            {
              id: 'info',
              title: 'Thông tin sự kiện',
              className: 'lg:col-span-2',
              content: (
          <main className="glass-card border-indigo-200/80 p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-sm font-semibold text-ink">{event.categoryName || 'Sự kiện'}</p><h1 className="mt-1 text-3xl font-bold text-slate-900">{event.name}</h1></div>
              <EventStatusBadge status={event.status} />
            </div>
            <dl className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="glass-tile border-indigo-200 p-4"><dt className="text-xs font-semibold uppercase text-slate-400">Bắt đầu</dt><dd className="mt-1 font-medium text-slate-800">{formatDateTime(event.startAt)}</dd></div>
              <div className="glass-tile border-amber-200 p-4"><dt className="text-xs font-semibold uppercase text-slate-400">Kết thúc</dt><dd className="mt-1 font-medium text-slate-800">{formatDateTime(event.endAt)}</dd></div>
              <div className="glass-tile border-emerald-200 p-4"><dt className="text-xs font-semibold uppercase text-slate-400">Địa điểm</dt><dd className="mt-1 font-medium text-slate-800">{event.location}</dd></div>
            </dl>
            <section className="mt-6"><h2 className="font-semibold text-slate-900">Mô tả</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{event.description || 'Chưa có mô tả cho sự kiện này.'}</p></section>
            <section className="glass-tile mt-7 p-4 sm:p-5 hover:translate-y-0 hover:border-slate-200 hover:shadow-raise">
              <h2 className="font-semibold text-slate-900">Thống kê tham dự</h2>
              <div className={`mt-4 grid grid-cols-1 gap-6 ${canManageEvent && attendanceSummary ? 'lg:grid-cols-2' : ''}`}>
                <div>
                  <div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">Số người đăng ký</span><span className="text-slate-600">{registered}/{event.capacity}</span></div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-ink transition-all" style={{ width: `${usagePercent}%` }} /></div>
                  {event.attendanceRate !== null && <div className="mt-4 border-t border-slate-100 pt-4"><AttendanceRateBar rate={event.attendanceRate} /></div>}
                </div>
                {canManageEvent && attendanceSummary && (
                  <div className="border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-700">Tổng hợp có mặt / vắng</h3><span className="text-xs font-semibold text-slate-500">{attendanceSummary.totalRegistered} đăng ký</span></div>
                    <AttendanceBarChart present={attendanceSummary.present} absent={attendanceSummary.absent} />
                  </div>
                )}
              </div>
            </section>
          </main>
              ),
            },
            {
              id: 'actions',
              title: 'Thao tác',
              className: 'lg:col-span-1',
              content: (
          <aside className="glass-card border-emerald-200/80 p-5">
            <h2 className="text-lg font-bold text-slate-900">Thao tác</h2>
            <div className="mt-5 flex flex-col gap-3">
              {user?.role === 'ROLE_USER' && (
                <>
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={!canRegister || isRegistering}
                    className="min-h-11 rounded-xl bg-ink px-4 py-2 font-semibold text-white hover:bg-ink-soft disabled:cursor-not-allowed disabled:bg-slate-300 raise"
                  >
                    {isRegistering ? 'Đang xử lý...' : isRegistered ? 'Đã đăng ký' : 'Đăng ký tham gia'}
                  </button>
                  {registrationDisabledReason && <p className="text-sm text-slate-500">{registrationDisabledReason}</p>}
                </>
              )}
              {canManageEvent && <>
                <button type="button" onClick={() => navigate(ROUTES.EVENT_EDIT.replace(':id', String(event.id)))} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-ink hover:bg-slate-50 raise">Sửa sự kiện</button>
                {event.status === 'OPEN' && <button type="button" onClick={() => setPendingStatus('CLOSED')} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 raise">Đóng sự kiện</button>}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.EVENT_REGISTRATIONS.replace(':eventId', String(event.id)))}
                  className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 raise"
                >
                  Xem người đăng ký
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.EVENT_CHECK_IN.replace(':eventId', String(event.id)))}
                  className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 raise"
                >
                  Điểm danh
                </button>
                {event.status === 'OPEN' && <button type="button" onClick={() => setPendingStatus('CANCELLED')} className="min-h-11 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">Huỷ sự kiện</button>}
              </>}
            </div>
          </aside>
              ),
            },
          ]}
        />
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
      <QrTicketModal
        open={newTicket !== null}
        registrationId={newTicket?.registrationId ?? null}
        code={newTicket?.code ?? ''}
        eventName={newTicket?.eventName ?? event.name}
        startAt={event.startAt}
        endAt={event.endAt}
        location={event.location}
        attendeeName={user?.fullName ?? null}
        onClose={() => setNewTicket(null)}
      />
    </div>
  );
}
