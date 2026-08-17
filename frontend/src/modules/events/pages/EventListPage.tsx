import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListIcon,
  PlusIcon,
} from '../../../components/common/Icons';
import Pagination from '../../../components/common/Pagination';
import SearchInput from '../../../components/common/SearchInput';
import SegmentedControl from '../../../components/ui/SegmentedControl';
import { ROUTES } from '../../../constants/routes';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermission } from '../../../hooks/usePermission';
import { getCategories } from '../../categories/categoriesApi';
import type { Category } from '../../categories/categoriesTypes';
import EventAgendaPanel from '../components/EventAgendaPanel';
import EventCard from '../components/EventCard';
import EventFilterBar from '../components/EventFilterBar';
import EventStatusReport from '../components/EventStatusReport';
import {
  addDays,
  buildCategoryOrder,
  formatMonthTitle,
  toDateParam,
  type EventFilterValue,
} from '../components/calendarShared';
import { getEvents } from '../eventsApi';
import type { EventsPage, EventSummary } from '../eventsTypes';

/**
 * Chỉ còn hai khung nhìn cho cùng một dữ liệu: LỊCH (bảng theo tháng) và DANH SÁCH
 * (thẻ có phân trang). Trước đây tách Ngày/Tuần/Tháng thành ba tab riêng, nhưng cả ba
 * chỉ khác nhau ở độ rộng khoảng thời gian — người dùng phải học ba cách đọc khác nhau
 * cho cùng một thứ.
 */
type ViewMode = 'calendar' | 'list';

const PAGE_SIZE = 9;
/** Lịch cần trọn khoảng đang xem trong một lần gọi (không phân trang) — 200 là trần an toàn */
const CALENDAR_PAGE_SIZE = 200;
/** Nới đầu khoảng truy vấn để bắt cả sự kiện bắt đầu trước đó mà còn kéo sang khoảng đang xem */
const LOOKBEHIND_DAYS = 7;

const EMPTY_PAGE: EventsPage = { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0, last: true };

const readPage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page - 1 : 0;
};

/** Link cũ còn dùng view=day/month vẫn mở được — mọi thứ không phải 'list' đều là lịch */
const readView = (value: string | null): ViewMode => (value === 'list' ? 'list' : 'calendar');

const parseDateParam = (value: string | null) => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);

export default function EventListPage() {
  const navigate = useNavigate();
  const canCreateEvent = usePermission(['ROLE_ADMIN', 'ROLE_ORGANIZER']);
  const [searchParams, setSearchParams] = useSearchParams();

  const view = readView(searchParams.get('view'));
  const isCalendar = view === 'calendar';
  const page = readPage(searchParams.get('page'));
  const keyword = searchParams.get('keyword')?.trim() ?? '';

  const anchor = useMemo(() => parseDateParam(searchParams.get('week')) ?? new Date(), [searchParams]);
  const monthStart = useMemo(() => startOfMonth(anchor), [anchor]);

  const filters: EventFilterValue = {
    categoryId: searchParams.get('categoryId') ?? '',
    status: searchParams.get('status') ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  };
  // Ở chế độ lịch, khoảng ngày do thanh điều hướng quyết định nên from/to không tính là
  // bộ lọc đang bật (và cũng không hiện trong panel)
  const activeFilterCount = isCalendar
    ? [filters.categoryId, filters.status].filter(Boolean).length
    : Object.values(filters).filter(Boolean).length;

  const [searchValue, setSearchValue] = useState(keyword);
  const debouncedSearchValue = useDebounce(searchValue, 400);
  const [result, setResult] = useState<EventsPage>(EMPTY_PAGE);
  const [categories, setCategories] = useState<Category[]>([]);
  /** Lần tải đầu tiên: hiện khung xương. Các lần sau chỉ làm mờ nhẹ nội dung cũ. */
  const [firstLoad, setFirstLoad] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const categoryOrder = useMemo(() => buildCategoryOrder(categories), [categories]);

  /**
   * react-router tạo lại `setSearchParams` mỗi khi URL đổi. Nếu để nó trong deps của
   * effect tải dữ liệu thì mọi thay đổi tham số URL — kể cả thứ chỉ lọc ở client như
   * `when` — đều kích hoạt một lượt gọi API thừa. Giữ qua ref để effect chỉ phụ thuộc
   * vào các tham số thực sự đổi kết quả truy vấn.
   */
  const setSearchParamsRef = useRef(setSearchParams);
  useEffect(() => {
    setSearchParamsRef.current = setSearchParams;
  });

  useEffect(() => {
    setSearchValue(keyword);
  }, [keyword]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

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

  // Chuỗi hoá khoảng ngày đang xem để useEffect dưới không phụ thuộc vào Date (đổi tham
  // chiếu mỗi lần render) mà chỉ chạy lại khi khoảng thực sự đổi
  const rangeKey = isCalendar ? `m:${toDateParam(monthStart)}` : 'list';

  useEffect(() => {
    let active = true;
    setFetching(true);
    setError(null);

    let dateRange: { from?: string; to?: string };
    if (isCalendar) {
      dateRange = {
        // Nới đầu khoảng để bắt cả sự kiện khởi động từ tháng trước mà còn kéo sang
        from: toDateParam(addDays(monthStart, -LOOKBEHIND_DAYS)),
        to: toDateParam(endOfMonth(monthStart)),
      };
    } else {
      dateRange = {
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
      };
    }

    getEvents(isCalendar ? 0 : page, isCalendar ? CALENDAR_PAGE_SIZE : PAGE_SIZE, keyword, {
      ...(filters.categoryId ? { categoryId: Number(filters.categoryId) } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...dateRange,
    })
      .then((data) => {
        if (!active) return;
        setResult(data);
        if (!isCalendar && data.totalPages > 0 && page >= data.totalPages) {
          setSearchParamsRef.current((current) => {
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
      .finally(() => {
        if (!active) return;
        setFetching(false);
        setFirstLoad(false);
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.categoryId, filters.from, filters.status, filters.to, isCalendar, keyword, page, rangeKey, reloadKey]);

  /** Tỷ lệ chỗ đã đăng ký của cả tháng — tính trên toàn bộ sự kiện đã tải, không theo bộ lọc */
  const fillPercent = useMemo(() => {
    let capacity = 0;
    let taken = 0;
    result.content.forEach((event) => {
      capacity += event.capacity ?? 0;
      taken += Math.max(0, (event.capacity ?? 0) - (event.availableSeats ?? 0));
    });
    return capacity > 0 ? Math.round((taken / capacity) * 100) : 0;
  }, [result.content]);

  const visibleEvents: EventSummary[] = result.content;

  const patchParams = (patch: Record<string, string | null>, options?: { replace?: boolean }) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(patch).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      return next;
    }, options);
  };

  const changeFilters = (nextFilters: EventFilterValue) => {
    patchParams({
      categoryId: nextFilters.categoryId || null,
      status: nextFilters.status || null,
      from: nextFilters.from || null,
      to: nextFilters.to || null,
      page: null,
    });
  };

  const clearFilters = () => changeFilters({ categoryId: '', status: '', from: '', to: '' });

  const changePage = (nextPage: number) => {
    patchParams({ page: nextPage === 0 ? null : String(nextPage + 1) });
    document.getElementById('app-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Bỏ tham số week khi quay về khoảng chứa hôm nay để URL sạch */
  const goToAnchor = (nextAnchor: Date) => {
    const next = startOfMonth(nextAnchor);
    patchParams({ week: toDateParam(next) === toDateParam(startOfMonth(new Date())) ? null : toDateParam(next) });
  };

  const stepRange = (direction: -1 | 1) => goToAnchor(addMonths(monthStart, direction));

  const switchView = (nextView: ViewMode) => {
    patchParams({ view: nextView === 'calendar' ? null : nextView, page: null });
  };

  const isCurrentRange = toDateParam(monthStart) === toDateParam(startOfMonth(new Date()));

  const hasNarrowedSearch = Boolean(keyword) || activeFilterCount > 0;
  const noResult = !fetching && !error && visibleEvents.length === 0;
  const showSkeleton = fetching && firstLoad;

  const title = isCalendar ? formatMonthTitle(monthStart) : 'Danh sách sự kiện';

  /**
   * MỘT dòng phụ duy nhất nói cả bối cảnh lẫn số lượng. Trước đây cùng một thông tin
   * xuất hiện ở huy hiệu cạnh tiêu đề, ở dải chip mốc thời gian và ở dòng "N kết quả
   * cho ..." — ba con số khác nhau cho cùng một câu hỏi "đang xem bao nhiêu sự kiện".
   */
  const scopeName = isCalendar ? 'Lịch tháng' : 'Tất cả sự kiện';
  const shownCount = isCalendar ? visibleEvents.length : result.totalElements;

  return (
    /*
      Chế độ lịch bị ghim đúng một màn hình (trừ đi thanh trên và lề khung ứng dụng) để
      lưới và panel tự cuộn bên trong — cả trang không bao giờ phải cuộn. Chế độ danh
      sách thì ngược lại: nó có phân trang nên cuộn cả trang mới là tự nhiên.
    */
    <div
      className={[
        'flex flex-col bg-workspace p-4 sm:p-5 lg:p-6',
        isCalendar ? 'min-h-full xl:h-[calc(100vh-5.5rem)]' : 'min-h-full',
      ].join(' ')}
    >
      {/*
        Hàng tiêu đề kiểu bảng điều khiển: tên khoảng đang xem cỡ lớn bên trái, mọi nút
        điều khiển gom về bên phải thành các viên thuốc trắng nổi trên nền xanh nhạt.
      */}
      <header className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        {/*
          min-w cỡ 17rem để khi hàng hết chỗ thì CẢ cụm nút xuống hàng dưới, thay vì
          tiêu đề tự co lại rồi bị cắt cụt thành "16 Tháng 8, 20…"
        */}
        <div className="min-w-[17rem] flex-1">
          <h1 className="truncate text-[26px] font-extrabold capitalize leading-tight tracking-tight text-ink sm:text-[32px]">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-[13px] text-slate-400" aria-live="polite">
            {scopeName} · <span className="tabular-nums">{shownCount}</span> sự kiện
            {isCalendar && ` · lấp đầy ${fillPercent}%`}
            {keyword && ` · cho “${keyword}”`}
          </p>
        </div>

        {/*
          ml-auto + justify-end: khi cả hàng đủ chỗ thì cụm nút nằm sát mép phải cạnh tiêu
          đề; khi tiêu đề đẩy nó xuống hàng dưới thì nó vẫn canh phải, nên mép phải của
          thanh công cụ luôn thẳng hàng với mép phải của lưới lịch và panel bên dưới.
        */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <div className="w-full sm:w-52 lg:w-60">
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              size="sm"
              placeholder="Tìm theo tên hoặc địa điểm..."
            />
          </div>

          {isCalendar && (
            <div className="inline-flex h-10 shrink-0 items-center rounded-full bg-white p-1 shadow-card">
              <button
                type="button"
                onClick={() => stepRange(-1)}
                aria-label={'Tháng trước'}
                title={'Tháng trước'}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-ink active:scale-90"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              {/*
                KHÔNG khoá nút khi đang ở khoảng chứa hôm nay: nút xám không bấm được
                trông y như nút hỏng. Thay vào đó tô nền để báo "bạn đang ở đây", bấm
                vẫn được và chỉ đơn giản là giữ nguyên chỗ cũ.
              */}
              <button
                type="button"
                onClick={() => goToAnchor(new Date())}
                aria-current={isCurrentRange ? 'date' : undefined}
                title="Về tháng chứa hôm nay"
                className={[
                  'h-8 rounded-full px-3 text-[13px] font-bold transition-colors duration-150 active:scale-95',
                  isCurrentRange ? 'bg-slate-100 text-ink' : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
                ].join(' ')}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => stepRange(1)}
                aria-label={'Tháng sau'}
                title={'Tháng sau'}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-ink active:scale-90"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          <SegmentedControl
            label="Kiểu hiển thị"
            value={view}
            onChange={switchView}
            compactOnMobile
            className="shrink-0"
            options={[
              { value: 'calendar', label: 'Lịch', icon: CalendarIcon },
              { value: 'list', label: 'Danh sách', icon: ListIcon },
            ]}
          />

          {canCreateEvent && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.EVENT_CREATE)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-indigo-500 px-4 text-[13px] font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-150 hover:bg-indigo-600 active:scale-[0.97]"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Tạo sự kiện</span>
            </button>
          )}
        </div>
      </header>

      <EventFilterBar
        isCalendar={isCalendar}
        categories={categories}
        categoryOrder={categoryOrder}
        filters={filters}
        onFiltersChange={changeFilters}
        onClear={clearFilters}
        activeCount={activeFilterCount}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row xl:gap-5">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {error ? (
            <div className="animate-rise rounded-3xl bg-red-50 p-8 text-center" role="alert">
              <p className="font-medium text-red-700">{error}</p>
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 font-semibold text-ink">Thử lại</button>
            </div>
          ) : (
            /* Chỉ làm mờ nhẹ khi tải lại (đổi tuần/bộ lọc) thay vì thay bằng khung xương —
               tránh giật khung và giữ cảm giác liền mạch khi chuyển qua lại giữa các tab */
            <div
              className={`flex min-h-0 flex-1 flex-col transition-opacity duration-200 ${fetching && !firstLoad ? 'opacity-50' : 'opacity-100'}`}
            >
              {noResult && isCalendar && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-card">
                  <p className="text-sm text-slate-600">
                    {hasNarrowedSearch ? (
                      keyword
                        ? <>Không tìm thấy sự kiện phù hợp với &apos;{keyword}&apos;</>
                        : 'Không có sự kiện phù hợp với bộ lọc'
                    ) : (
                      'Tháng này chưa có sự kiện nào'
                    )}
                  </p>
                  {hasNarrowedSearch ? (
                    <button
                      type="button"
                      onClick={() => { setSearchValue(''); clearFilters(); }}
                      className="inline-flex h-9 items-center rounded-full bg-slate-100 px-4 text-[13px] font-bold text-ink-muted transition-all duration-150 hover:bg-ink hover:text-white active:scale-[0.97]"
                    >
                      Xóa bộ lọc
                    </button>
                  ) : null}
                </div>
              )}

              {isCalendar ? (
                <div key={rangeKey} className="animate-rise flex min-h-0 flex-1 flex-col">
                  <EventStatusReport
                    events={visibleEvents}
                    monthStart={monthStart}
                    loading={showSkeleton}
                    categoryOrder={categoryOrder}
                  />
                </div>
              ) : showSkeleton ? (
                <div className="space-y-3" aria-label="Đang tải danh sách sự kiện">
                  {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/70" />)}
                </div>
              ) : noResult && hasNarrowedSearch ? (
                <div className="animate-rise rounded-3xl bg-white px-6 py-14 text-center shadow-card">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400" aria-hidden="true">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="10.5" cy="10.5" r="6.5" /><path strokeLinecap="round" d="m16 16 4 4M8 9h5M8 12h3" />
                    </svg>
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-ink">
                    {keyword ? <>Không tìm thấy sự kiện phù hợp với &apos;{keyword}&apos;</> : 'Không có sự kiện phù hợp với bộ lọc'}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Thử thay đổi điều kiện hoặc xóa bộ lọc để xem lại tất cả sự kiện.</p>
                  <button
                    type="button"
                    onClick={() => { setSearchValue(''); clearFilters(); }}
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-sm font-bold text-white transition-all duration-150 hover:bg-ink-soft active:scale-[0.97]"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : noResult ? (
                <div className="animate-rise rounded-3xl bg-white p-12 text-center shadow-card">
                  <p className="text-lg font-semibold text-slate-700">Chưa có sự kiện nào</p>
                  <p className="mt-1 text-sm text-slate-500">Các sự kiện mới sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {visibleEvents.map((event) => (
                      <EventCard key={event.id} event={event} categoryOrder={categoryOrder} />
                    ))}
                  </div>
                  <div className="mt-8"><Pagination page={page} totalPages={result.totalPages} onChange={changePage} /></div>
                </>
              )}
            </div>
          )}
        </div>

        <EventAgendaPanel
          events={visibleEvents}
          categoryOrder={categoryOrder}
          className="shrink-0 xl:h-full xl:w-[19rem]"
        />
      </div>
    </div>
  );
}
