import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Pagination from '../../../components/common/Pagination';
import SearchInput from '../../../components/common/SearchInput';
import { ROUTES } from '../../../constants/routes';
import { useDebounce } from '../../../hooks/useDebounce';
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
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const [searchValue, setSearchValue] = useState(keyword);
  const debouncedSearchValue = useDebounce(searchValue, 400);
  const [result, setResult] = useState<EventsPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setSearchValue(keyword);
  }, [keyword]);

  useEffect(() => {
    const nextKeyword = debouncedSearchValue.trim();
    if (nextKeyword === keyword) return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextKeyword) next.set('keyword', nextKeyword);
      else next.delete('keyword');
      next.delete('page');
      return next;
    }, { replace: true });
  }, [debouncedSearchValue, keyword, setSearchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getEvents(page, PAGE_SIZE, keyword)
      .then((data) => {
        if (!active) return;
        setResult(data);
        if (data.totalPages > 0 && page >= data.totalPages) {
          setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.set('page', String(data.totalPages));
            return next;
          }, { replace: true });
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message : undefined;
        setError(message ?? 'Không thể tải danh sách sự kiện. Vui lòng thử lại.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [keyword, page, reloadKey, setSearchParams]);

  const changePage = (nextPage: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextPage === 0) next.delete('page');
      else next.set('page', String(nextPage + 1));
      return next;
    });
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
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Tìm theo tên hoặc địa điểm..."
            />
            {keyword && !loading && (
              <p className="text-sm text-slate-500" aria-live="polite">
                <span className="font-semibold text-slate-800">{result.totalElements}</span> kết quả cho “{keyword}”
              </p>
            )}
          </div>
        </div>
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert">
            <p className="font-medium text-red-700">{error}</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 font-semibold text-blue-700">Thử lại</button>
          </div>
        ) : loading ? (
          <div className="space-y-4" aria-label="Đang tải danh sách sự kiện">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}
          </div>
        ) : result.content.length === 0 && keyword ? (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-gradient-to-b from-blue-50/70 to-white px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700" aria-hidden="true">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="10.5" cy="10.5" r="6.5" /><path strokeLinecap="round" d="m16 16 4 4M8 9h5M8 12h3" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-800">Không tìm thấy sự kiện phù hợp với &apos;{keyword}&apos;</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Thử kiểm tra lại từ khóa hoặc tìm bằng một tên, địa điểm khác.</p>
            <button
              type="button"
              onClick={() => setSearchValue('')}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Xóa bộ lọc
            </button>
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
