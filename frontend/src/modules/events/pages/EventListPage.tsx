import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Pagination from '../../../components/common/Pagination';
import { ROUTES } from '../../../constants/routes';
import { usePermission } from '../../../hooks/usePermission';
import EventCard from '../components/EventCard';
import { getEvents } from '../eventsApi';
import type { EventsPage } from '../eventsTypes';

const PAGE_SIZE = 9;
const EMPTY_PAGE: EventsPage = { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0, last: true };

const readPage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page - 1 : 0;
};

export default function EventListPage() {
  const navigate = useNavigate();
  const canCreateEvent = usePermission(['ROLE_ADMIN', 'ROLE_ORGANIZER']);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readPage(searchParams.get('page'));
  const [result, setResult] = useState<EventsPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getEvents(page, PAGE_SIZE)
      .then((data) => {
        if (!active) return;
        setResult(data);
        if (data.totalPages > 0 && page >= data.totalPages) setSearchParams({ page: String(data.totalPages) }, { replace: true });
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message : undefined;
        setError(message ?? 'Không thể tải danh sách sự kiện. Vui lòng thử lại.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page, reloadKey, setSearchParams]);

  const changePage = (nextPage: number) => {
    setSearchParams(nextPage === 0 ? {} : { page: String(nextPage + 1) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Khám phá</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Danh sách sự kiện</h1>
            <p className="mt-2 text-sm text-slate-500">{result.totalElements} sự kiện trong hệ thống</p>
          </div>
          {canCreateEvent && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.EVENT_CREATE)}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <span className="text-xl leading-none">＋</span> Tạo sự kiện
            </button>
          )}
        </header>
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert">
            <p className="font-medium text-red-700">{error}</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 font-semibold text-blue-700">Thử lại</button>
          </div>
        ) : loading ? (
          <div className="space-y-4" aria-label="Đang tải danh sách sự kiện">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}
          </div>
        ) : result.content.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-slate-700">Chưa có sự kiện nào</p>
            <p className="mt-1 text-sm text-slate-500">Các sự kiện mới sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {result.content.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
            <div className="mt-8"><Pagination page={page} totalPages={result.totalPages} onChange={changePage} /></div>
          </>
        )}
      </div>
    </div>
  );
}
