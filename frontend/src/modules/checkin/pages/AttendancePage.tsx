import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AttendanceSummaryCards from '../components/AttendanceSummaryCards';
import { getAttendanceSummary } from '../checkinApi';
import type { AttendanceItem, AttendanceSummaryResponse } from '../checkinTypes';

const EMPTY_DATA: AttendanceSummaryResponse = {
  summary: { totalRegistered: 0, present: 0, absent: 0, attendanceRate: 0 },
  present: [],
  absent: [],
};

const formatTime = (value: string | null) => value
  ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : '—';

interface AttendanceTableProps {
  title: string;
  items: AttendanceItem[];
  present?: boolean;
}

function AttendanceTable({ title, items, present = false }: AttendanceTableProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-bold text-slate-900">{title} ({items.length})</h2>
      </header>
      {items.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">Không có người tham gia trong danh sách này.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">Họ tên</th><th className="px-4 py-3">Email</th>{present && <th className="whitespace-nowrap px-4 py-3">Giờ check-in</th>}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.registrationId}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{item.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{item.email}</td>
                  {present && <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700">{formatTime(item.checkedInAt)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AttendancePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const numericEventId = Number(eventId);
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!Number.isInteger(numericEventId) || numericEventId <= 0) { setError('Không tìm thấy sự kiện.'); setLoading(false); return; }
    let active = true;
    setLoading(true); setError(null);
    getAttendanceSummary(numericEventId)
      .then((response) => active && setData(response ?? EMPTY_DATA))
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message : undefined;
        setError(message ?? 'Không thể tải tổng hợp điểm danh.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [numericEventId, reloadKey]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={() => navigate(`/events/${numericEventId}/check-in`)} className="mb-5 text-sm font-semibold text-blue-700">← Quay lại điểm danh</button>
        <header className="mb-6"><p className="text-sm font-semibold text-blue-600">Báo cáo điểm danh</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Tổng hợp có mặt / vắng</h1><p className="mt-2 text-sm text-slate-500">Theo dõi nhanh tình hình tham dự của sự kiện.</p></header>
        {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700"><p>{error}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 font-semibold text-blue-700">Thử lại</button></div>
          : loading ? <div aria-label="Đang tải tổng hợp điểm danh" className="space-y-5"><div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}</div><div className="grid grid-cols-1 gap-5 lg:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-200" />)}</div></div>
          : <><AttendanceSummaryCards summary={data.summary} /><div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-2"><AttendanceTable title="Có mặt" items={data.present} present /><AttendanceTable title="Vắng" items={data.absent} /></div></>}
      </div>
    </div>
  );
}
