import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Pagination from '../../../components/common/Pagination';
import AttendanceSummaryCards from '../components/AttendanceSummaryCards';
import { getAttendanceList, getAttendanceSummary } from '../checkinApi';
import type {
  AttendanceFilter,
  AttendanceItem,
  AttendancePageResponse,
  AttendanceSummaryResponse,
} from '../checkinTypes';

const PAGE_SIZE = 10;
const EMPTY_SUMMARY: AttendanceSummaryResponse = {
  summary: { totalRegistered: 0, present: 0, absent: 0, attendanceRate: 0 },
  present: [],
  absent: [],
};
const EMPTY_PAGE: AttendancePageResponse = {
  content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0, last: true,
};

const FILTERS: Array<{ value: AttendanceFilter; label: string; description: string }> = [
  { value: 'all', label: 'Tất cả', description: 'Toàn bộ người đăng ký' },
  { value: 'present', label: 'Đã đến', description: 'Đã hoàn tất check-in' },
  { value: 'absent', label: 'Chưa đến', description: 'Chưa được check-in' },
];

const readFilter = (value: string | null): AttendanceFilter =>
  value === 'present' || value === 'absent' ? value : 'all';

const readPage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page - 1 : 0;
};

const formatDateTime = (value?: string | null) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : '—';

const getErrorMessage = (error: unknown) => axios.isAxiosError<{ message?: string }>(error)
  ? error.response?.data?.message
  : undefined;

function StatusBadge({ checkedIn }: { checkedIn: boolean }) {
  return checkedIn ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Đã đến
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Chưa đến
    </span>
  );
}

function MobileCard({ item, order }: { item: AttendanceItem; order: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${item.checkedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {item.fullName.trim().charAt(0).toUpperCase() || order}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{item.fullName}</p>
            <p className="mt-0.5 truncate text-sm text-slate-500">{item.email}</p>
          </div>
        </div>
        <StatusBadge checkedIn={item.checkedIn} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
        <div><dt className="text-xs font-medium text-slate-400">Số điện thoại</dt><dd className="mt-1 font-medium text-slate-700">{item.phone || '—'}</dd></div>
        <div><dt className="text-xs font-medium text-slate-400">Thời gian check-in</dt><dd className={`mt-1 font-semibold ${item.checkedIn ? 'text-emerald-700' : 'text-slate-500'}`}>{formatDateTime(item.checkedInAt)}</dd></div>
      </dl>
    </article>
  );
}

export default function AttendancePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const numericEventId = Number(eventId);
  const status = readFilter(searchParams.get('status'));
  const page = readPage(searchParams.get('page'));
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [result, setResult] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!Number.isInteger(numericEventId) || numericEventId <= 0) {
      setError('Không tìm thấy sự kiện.'); setLoading(false); return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      getAttendanceSummary(numericEventId),
      getAttendanceList(numericEventId, status, page, PAGE_SIZE),
    ])
      .then(([summaryData, pageData]) => {
        if (!active) return;
        setSummary(summaryData ?? EMPTY_SUMMARY);
        setResult(pageData ?? EMPTY_PAGE);
        if ((pageData?.totalPages ?? 0) > 0 && page >= (pageData?.totalPages ?? 0)) {
          setSearchParams({ status, page: String(pageData.totalPages) }, { replace: true });
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError) ?? 'Không thể tải danh sách điểm danh.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [numericEventId, page, reloadKey, setSearchParams, status]);

  const changeFilter = (nextStatus: AttendanceFilter) => {
    setSearchParams({ status: nextStatus, page: '1' });
  };

  const changePage = (nextPage: number) => {
    setSearchParams({ status, page: String(nextPage + 1) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilter = FILTERS.find((filter) => filter.value === status) ?? FILTERS[0];

  return (
    <div className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={() => navigate(`/events/${numericEventId}/check-in`)} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700">
          <span aria-hidden="true">←</span> Quay lại điểm danh
        </button>

        <header className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">Báo cáo điểm danh</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">Danh sách tham dự</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Đối chiếu nhanh người đã đến và chưa đến, dữ liệu được cập nhật trực tiếp từ hệ thống.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Tỷ lệ có mặt</p>
              <p className="mt-1 text-3xl font-extrabold">{summary.summary.attendanceRate.toFixed(1)}%</p>
            </div>
          </div>
        </header>

        {error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
            <p className="font-semibold">{error}</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 rounded-xl bg-red-100 px-4 py-2 font-bold transition hover:bg-red-200">Thử lại</button>
          </div>
        ) : (
          <>
            <AttendanceSummaryCards summary={summary.summary} />

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Bộ lọc danh sách</p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">{activeFilter.label}</h2>
                  <p className="mt-1 text-sm text-slate-500">{activeFilter.description} · {result.totalElements} kết quả</p>
                </div>
                <div className="w-full lg:w-72">
                  <label htmlFor="attendance-status" className="mb-1.5 block text-sm font-semibold text-slate-700">Trạng thái tham dự</label>
                  <div className="relative">
                    <select id="attendance-status" value={status} onChange={(event) => changeFilter(event.target.value as AttendanceFilter)} className="min-h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                      {FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">⌄</span>
                  </div>
                </div>
              </div>
            </section>

            {loading ? (
              <div aria-label="Đang tải danh sách điểm danh" className="mt-5 space-y-3">
                {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}
              </div>
            ) : result.content.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl" aria-hidden="true">✓</div>
                <p className="mt-4 text-lg font-bold text-slate-800">Không có dữ liệu {activeFilter.label.toLowerCase()}</p>
                <p className="mt-1 text-sm text-slate-500">Hãy chọn trạng thái khác để xem danh sách tham dự.</p>
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-3 sm:hidden">
                  {result.content.map((item, index) => <MobileCard key={item.registrationId} item={item} order={page * PAGE_SIZE + index + 1} />)}
                </div>
                <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <tr><th className="px-5 py-4">STT</th><th className="px-5 py-4">Người tham gia</th><th className="px-5 py-4">Liên hệ</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Thời gian check-in</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.content.map((item, index) => (
                          <tr key={item.registrationId} className="transition hover:bg-blue-50/40">
                            <td className="px-5 py-4 font-semibold text-slate-400">{String(page * PAGE_SIZE + index + 1).padStart(2, '0')}</td>
                            <td className="px-5 py-4"><p className="font-bold text-slate-900">{item.fullName}</p><p className="mt-0.5 text-xs text-slate-400">Đăng ký {formatDateTime(item.registeredAt)}</p></td>
                            <td className="px-5 py-4"><p className="text-slate-700">{item.email}</p><p className="mt-0.5 text-xs text-slate-400">{item.phone || 'Chưa có SĐT'}</p></td>
                            <td className="px-5 py-4"><StatusBadge checkedIn={item.checkedIn} /></td>
                            <td className={`whitespace-nowrap px-5 py-4 font-semibold ${item.checkedIn ? 'text-emerald-700' : 'text-slate-400'}`}>{formatDateTime(item.checkedInAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-7"><Pagination page={page} totalPages={result.totalPages} onChange={changePage} /></div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
