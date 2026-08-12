import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Pagination from '../../../components/common/Pagination';
import { ROUTES } from '../../../constants/routes';
import { getEventRegistrations } from '../../registrations/registrationsApi';
import type { EventRegistrationItem, EventRegistrationsResponse } from '../../registrations/registrationsTypes';

const PAGE_SIZE = 10;
const EMPTY_RESPONSE: EventRegistrationsResponse = {
  registrations: {
    content: [],
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    last: true,
  },
  summary: {
    totalRegistered: 0,
    capacity: null,
  },
};

const readPage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page - 1 : 0;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  const time = new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(date);
  const day = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(date);
  return `${time} ${day}`;
};

export default function EventRegistrationsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readPage(searchParams.get('page'));
  const [response, setResponse] = useState<EventRegistrationsResponse>(EMPTY_RESPONSE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const eventIdNumber = Number(eventId);

  useEffect(() => {
    if (!Number.isInteger(eventIdNumber) || eventIdNumber <= 0) {
      setError('Không tìm thấy sự kiện.');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getEventRegistrations(eventIdNumber, page, PAGE_SIZE)
      .then((data) => {
        if (!active) return;
        setResponse(data ?? EMPTY_RESPONSE);
        if ((data?.registrations.totalPages ?? 0) > 0 && page >= (data?.registrations.totalPages ?? 0)) {
          setSearchParams({ page: String(data?.registrations.totalPages ?? 0) }, { replace: true });
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.data?.message
          : undefined;
        setError(message ?? 'Không thể tải danh sách người đăng ký.');
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [eventIdNumber, page, reloadKey, setSearchParams]);

  const usagePercent = useMemo(() => {
    const capacity = response.summary.capacity ?? 0;
    if (capacity <= 0) return 0;
    return Math.min(100, Math.round((response.summary.totalRegistered / capacity) * 100));
  }, [response.summary.capacity, response.summary.totalRegistered]);

  const changePage = (nextPage: number) => {
    setSearchParams(nextPage === 0 ? {} : { page: String(nextPage + 1) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={() => navigate(ROUTES.EVENTS)} className="mb-5 text-sm font-semibold text-blue-700">
          ← Quay lại danh sách sự kiện
        </button>

        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Đăng ký sự kiện</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Danh sách người đăng ký</h1>
            <p className="mt-2 text-sm text-slate-500">Theo dõi danh sách đăng ký và sức chứa của sự kiện.</p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <button
              type="button"
              onClick={() => navigate(`/events/${eventIdNumber}/check-in`)}
              className="min-h-12 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Mở màn hình điểm danh
            </button>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Đã đăng ký: {response.summary.totalRegistered} / {response.summary.capacity ?? 0}</p>
            <div className="mt-2 h-2.5 w-48 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={usagePercent}>
              <div
                className={`h-full rounded-full transition-all ${usagePercent >= 80 ? 'bg-amber-500' : 'bg-blue-600'}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert">
            <p className="font-medium text-red-700">{error}</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 font-semibold text-blue-700">
              Thử lại
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3" aria-label="Đang tải danh sách người đăng ký">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : response.registrations.content.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-700">Chưa có người đăng ký</p>
            <p className="mt-1 text-sm text-slate-500">Danh sách người tham gia sẽ hiển thị ở đây khi có đăng ký mới.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">STT</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Họ tên</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-slate-700 sm:table-cell">SĐT</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Đăng ký lúc</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {response.registrations.content.map((item: EventRegistrationItem, index: number) => (
                    <tr key={item.id} className="bg-white">
                      <td className="px-4 py-3 font-medium text-slate-700">{page * PAGE_SIZE + index + 1}</td>
                      <td className="px-4 py-3 text-slate-800">{item.fullName}</td>
                      <td className="px-4 py-3 text-slate-700">{item.email}</td>
                      <td className="hidden px-4 py-3 text-slate-700 sm:table-cell">{item.phone}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDateTime(item.registeredAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {item.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã huỷ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8">
              <Pagination page={page} totalPages={response.registrations.totalPages} onChange={changePage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
