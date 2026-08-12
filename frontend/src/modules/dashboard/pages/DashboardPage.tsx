import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EventStatusBadge from '../../../components/common/EventStatusBadge';
import { ROUTES } from '../../../constants/routes';
import { getEvents } from '../../events/eventsApi';
import type { EventSummary } from '../../events/eventsTypes';

// B4.3-T2/T4: dashboard tổng quan hiển thị tỷ lệ tham dự theo từng sự kiện — lấy
// chung nguồn dữ liệu với danh sách sự kiện (GET /events), không có API riêng.
const FETCH_SIZE = 100;

// Một series (tỷ lệ tham dự) → một màu duy nhất cho mọi cột (xanh dương đậm),
// không mã hoá thêm theo giá trị — tránh double-encode khi độ cao cột đã thể
// hiện giá trị rồi (xem dataviz skill § anti-patterns: value-ramp trên nominal category).
const BAR_COLOR = '#1c5cab';

const INNER_GRID_STEPS = [25, 50, 75];
const PLOT_HEIGHT = 248;

function AttendanceColumn({ event }: { event: EventSummary }) {
  const rate = event.attendanceRate;
  const heightPercent = rate !== null ? Math.min(100, Math.max(0, rate)) : 0;

  return (
    <Link
      to={ROUTES.EVENT_DETAIL.replace(':id', String(event.id))}
      className="group relative flex h-full w-20 shrink-0 flex-col items-center gap-2 rounded-xl px-1 pb-2 pt-1 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span className="text-xs font-semibold tabular-nums text-slate-700">{rate !== null ? `${rate}%` : '—'}</span>

      <span className="relative w-6 flex-1 overflow-hidden rounded-t bg-slate-100">
        {INNER_GRID_STEPS.map((step) => (
          <i key={step} className="pointer-events-none absolute inset-x-0 border-t border-slate-200/80" style={{ bottom: `${step}%` }} aria-hidden="true" />
        ))}
        {rate !== null && (
          <span
            className="absolute inset-x-0 bottom-0 rounded-t transition-[height] group-hover:brightness-110"
            style={{ height: `${heightPercent}%`, backgroundColor: BAR_COLOR }}
          />
        )}
      </span>

      <span className="w-full truncate text-center text-[11px] font-medium text-slate-500">{event.name}</span>

      <span
        role="tooltip"
        className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 scale-95 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
      >
        {rate !== null ? `${event.name} · ${rate}%` : `${event.name} · Chưa có dữ liệu điểm danh`}
      </span>
    </Link>
  );
}

export default function DashboardPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getEvents(0, FETCH_SIZE)
      .then((data) => active && setEvents(data.content))
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message : undefined;
        setError(message ?? 'Không thể tải dữ liệu dashboard.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [reloadKey]);

  const withRate = events.filter((event) => event.attendanceRate !== null);
  const averageRate = withRate.length > 0
    ? Math.round((withRate.reduce((sum, event) => sum + (event.attendanceRate ?? 0), 0) / withRate.length) * 10) / 10
    : 0;

  // Sắp xếp giảm dần theo tỷ lệ để dễ so sánh trên biểu đồ; sự kiện chưa có dữ liệu xuống cuối.
  const rankedEvents = [...events].sort((a, b) => (b.attendanceRate ?? -1) - (a.attendanceRate ?? -1));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <p className="text-sm font-semibold text-blue-600">Tổng quan</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Tỷ lệ tham dự theo từng sự kiện, dùng để đánh giá hiệu quả tổ chức.</p>
        </header>

        {error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            <p>{error}</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 font-semibold text-blue-700">Thử lại</button>
          </div>
        ) : loading ? (
          <div aria-label="Đang tải dashboard" className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-200" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">Chưa có sự kiện nào.</div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:max-w-xs">
              <p className="text-xs font-semibold uppercase text-slate-400">Tỷ lệ tham dự trung bình</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{averageRate}%</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Tỷ lệ tham dự theo sự kiện</h2>
                  <p className="mt-1 text-xs text-slate-500">Chiều cao cột thể hiện phần trăm người tham dự đã điểm danh.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode((mode) => (mode === 'chart' ? 'table' : 'chart'))}
                  className="shrink-0 self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:self-auto"
                >
                  {viewMode === 'chart' ? 'Xem dạng bảng' : 'Xem biểu đồ'}
                </button>
              </div>

              {viewMode === 'chart' ? (
                <div className="flex items-stretch gap-3 overflow-x-auto px-5 pb-6 pt-12" style={{ height: PLOT_HEIGHT }}>
                  {rankedEvents.map((event) => <AttendanceColumn key={event.id} event={event} />)}
                </div>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Sự kiện</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Tỷ lệ tham dự</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <Link to={ROUTES.EVENT_DETAIL.replace(':id', String(event.id))} className="hover:text-blue-700 hover:underline">{event.name}</Link>
                        </td>
                        <td className="px-4 py-3"><EventStatusBadge status={event.status} /></td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-700">
                          {event.attendanceRate !== null ? `${event.attendanceRate}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
