import axios from 'axios';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  ChartIcon,
  CheckSquareIcon,
  ChevronRightIcon,
  ClockIcon,
  PinIcon,
  PlusIcon,
  SparkIcon,
  TagIcon,
  TicketIcon,
  UsersIcon,
} from '../../../components/common/Icons';
import SortableGrid from '../../../components/ui/SortableGrid';
import { ROUTES } from '../../../constants/routes';
import { selectRole, selectUser } from '../../../stores/slices/authSlice';
import { useAppSelector } from '../../../stores/store';
import { getDashboardSummary } from '../../dashboard/dashboardApi';
import type { DashboardStat } from '../../dashboard/dashboardTypes';
import { addDays, startOfDay, toDateParam } from '../../events/components/calendarShared';
import { getEvents } from '../../events/eventsApi';
import type { EventSummary } from '../../events/eventsTypes';
import { getMyRegistrations } from '../../registrations/registrationsApi';
import type { MyRegistration } from '../../registrations/registrationsTypes';

/** Cửa sổ thời gian trang chủ quan tâm: từ hôm nay tới 60 ngày tới */
const HORIZON_DAYS = 60;
const UPCOMING_FETCH_SIZE = 100;
/** Sự kiện gần nhất đã lên thẻ nổi bật, danh sách bên dưới nối tiếp từ sự kiện thứ hai */
const UPCOMING_LIST_COUNT = 3;
const SCHEDULE_ITEM_COUNT = 3;
/** Số ngày trên dải lịch ngang ở đáy thẻ chào */
const DAY_STRIP_COUNT = 7;

/** Khoá localStorage nhớ thứ tự các thẻ */
const CARD_ORDER_KEY = 'qlskdd.home.cardOrder';

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const formatHhMm = (value: string) => {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/** "còn 3 ngày" / "còn 5 giờ" — cho biết mức độ gấp mà không cần đọc kỹ ngày giờ */
function countdownLabel(startAt: string, now: Date) {
  const diffMs = new Date(startAt).getTime() - now.getTime();
  if (diffMs <= 0) return 'Đang diễn ra';
  const hours = Math.round(diffMs / 3600000);
  if (hours < 1) return 'Sắp bắt đầu';
  if (hours < 24) return `Còn ${hours} giờ`;
  return `Còn ${Math.round(hours / 24)} ngày`;
}

/* ------------------------------- Kính mờ ------------------------------- */

/**
 * Tấm kính mờ — chỉ là cái KHAY chứa, nên cố tình giữ trung tính: nền trắng bán
 * trong, viền trắng mảnh, bóng mềm. Màu sắc dồn hết cho các ô nhỏ bên trong; tô màu
 * cả khay lẫn ô bên trong thì hai lớp viền màu lồng nhau nhìn rất rối.
 *
 * Chữ bên trong dùng thang MÀU MỰC như mọi trang khác, không phải chữ trắng: nền sáng
 * nên chữ đậm vừa dễ đọc vừa an toàn — mất lớp nền cũng không mất chữ.
 */
function Glass({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`glass-card h-full ${className}`}>
      {children}
    </div>
  );
}

/** Nhãn nhóm nhỏ ở đầu mỗi tấm kính */
function GlassTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</h2>
      {action}
    </div>
  );
}

function GlassAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-raise transition-all duration-150 hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white hover:shadow-raise-lg active:translate-y-0 active:scale-90"
    >
      <ChevronRightIcon className="h-3.5 w-3.5" />
    </Link>
  );
}

/** Ô số liệu — thẻ trắng đặc lồng trong tấm kính, vẫn là liên kết dẫn đi */
function StatTile({
  icon,
  label,
  value,
  to,
  accent,
  border,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  to: string;
  /** Sắc riêng của ô: nền huy hiệu biểu tượng + màu viền của chính ô đó */
  accent: string;
  border: string;
}) {
  return (
    <Link
      to={to}
      className={`group flex min-w-0 flex-col gap-2 rounded-2xl border bg-white p-3 shadow-raise transition-all duration-200 hover:-translate-y-1 hover:shadow-raise-lg ${border}`}
    >
      <span className="flex items-center gap-1.5 text-slate-400">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${accent}`}>
          {icon}
        </span>
        <span className="truncate text-[10.5px] font-bold uppercase tracking-wide">{label}</span>
      </span>
      <span className="text-[24px] font-extrabold leading-none tabular-nums text-ink">{value}</span>
    </Link>
  );
}

/* -------------------------------- Trang -------------------------------- */

export default function HomePage() {
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectRole);
  const isStaff = role === 'ROLE_ADMIN' || role === 'ROLE_ORGANIZER';

  const [upcoming, setUpcoming] = useState<EventSummary[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<MyRegistration[]>([]);
  const [stat, setStat] = useState<DashboardStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Đổi khoá này là lưới thẻ được dựng lại và đọc lại thứ tự (lúc này đã trống) */
  const [layoutKey, setLayoutKey] = useState(0);

  const resetLayout = () => {
    try {
      localStorage.removeItem(CARD_ORDER_KEY);
    } catch {
      // Trình duyệt chặn localStorage — vẫn đưa bố cục về mặc định cho phiên hiện tại
    }
    setLayoutKey((key) => key + 1);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const now = new Date();

    const requests: [Promise<unknown>, Promise<unknown>, Promise<unknown>] = [
      getEvents(0, UPCOMING_FETCH_SIZE, '', {
        from: toDateParam(now),
        to: toDateParam(addDays(now, HORIZON_DAYS)),
        status: 'OPEN',
      }),
      getMyRegistrations(0, 20),
      // Chỉ ADMIN/ORGANIZER mới được gọi /dashboard/summary; gọi khi là USER sẽ nhận 403
      // và bắn toast "không đủ quyền" gây hoang mang dù người dùng chẳng làm gì sai.
      isStaff ? getDashboardSummary() : Promise.resolve(null),
    ];

    Promise.all(requests)
      .then(([eventsPage, registrationsPage, summary]) => {
        if (!active) return;
        const events = (eventsPage as { content: EventSummary[] }).content;
        // API chưa nhận tham số sắp xếp nên xếp gần nhất lên đầu ở client
        setUpcoming([...events].sort((a, b) => a.startAt.localeCompare(b.startAt)));
        setMyRegistrations(
          (registrationsPage as { content: MyRegistration[] }).content
            .filter((item) => item.registrationStatus === 'ACTIVE' && new Date(item.endAt) >= now)
            .sort((a, b) => a.startAt.localeCompare(b.startAt)),
        );
        setStat(summary as DashboardStat | null);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.data?.message
          : undefined;
        setError(message ?? 'Không thể tải dữ liệu trang chủ. Vui lòng thử lại.');
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [isStaff]);

  const now = useMemo(() => new Date(), []);
  const thisWeekCount = useMemo(() => {
    const limit = addDays(now, 7);
    return upcoming.filter((event) => new Date(event.startAt) <= limit).length;
  }, [upcoming, now]);

  const heroLine = loading
    ? 'Đang tải dữ liệu…'
    : thisWeekCount > 0
      ? `Có ${thisWeekCount} sự kiện sẽ diễn ra trong 7 ngày tới.`
      : upcoming.length > 0
        ? `Chưa có sự kiện nào trong tuần này, nhưng còn ${upcoming.length} sự kiện sắp tới.`
        : 'Hiện chưa có sự kiện nào sắp diễn ra.';

  /** Dải bảy ngày tới, kèm số sự kiện của từng ngày — bản đồ thời gian gần nhất */
  const dayStrip = useMemo(() => {
    const today = startOfDay(now);
    return Array.from({ length: DAY_STRIP_COUNT }, (_, index) => {
      const day = addDays(today, index);
      const count = upcoming.filter((event) => {
        const start = new Date(event.startAt);
        const end = new Date(event.endAt);
        return startOfDay(start) <= day && startOfDay(end) >= day;
      }).length;
      return { day, count, isToday: index === 0 };
    });
  }, [now, upcoming]);

  const stats = isStaff
    ? [
        { icon: <CalendarIcon className="h-3.5 w-3.5" />, label: 'Tổng sự kiện', value: `${stat?.totalEvents ?? 0}`, to: ROUTES.DASHBOARD, accent: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-200' },
        { icon: <SparkIcon className="h-3.5 w-3.5" />, label: 'Sắp diễn ra', value: `${stat?.upcomingEvents ?? 0}`, to: ROUTES.EVENTS, accent: 'bg-amber-100 text-amber-600', border: 'border-amber-200' },
        { icon: <TicketIcon className="h-3.5 w-3.5" />, label: 'Lượt đăng ký', value: `${stat?.totalRegistrations ?? 0}`, to: ROUTES.PARTICIPANTS, accent: 'bg-sky-100 text-sky-600', border: 'border-sky-200' },
        { icon: <CheckSquareIcon className="h-3.5 w-3.5" />, label: 'Tỷ lệ điểm danh', value: `${stat?.attendanceRate ?? 0}%`, to: ROUTES.DASHBOARD, accent: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200' },
      ]
    : [
        { icon: <TicketIcon className="h-3.5 w-3.5" />, label: 'Sự kiện của tôi', value: `${myRegistrations.length}`, to: ROUTES.MY_REGISTRATIONS, accent: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-200' },
        { icon: <CalendarIcon className="h-3.5 w-3.5" />, label: 'Sắp diễn ra', value: `${upcoming.length}`, to: ROUTES.EVENTS, accent: 'bg-sky-100 text-sky-600', border: 'border-sky-200' },
        { icon: <SparkIcon className="h-3.5 w-3.5" />, label: 'Trong 7 ngày tới', value: `${thisWeekCount}`, to: ROUTES.EVENTS, accent: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200' },
      ];

  const shortcuts = [
    { label: 'Lịch sự kiện', to: ROUTES.EVENTS, icon: <CalendarIcon className="h-3.5 w-3.5" /> },
    { label: 'Sự kiện của tôi', to: ROUTES.MY_REGISTRATIONS, icon: <TicketIcon className="h-3.5 w-3.5" /> },
    ...(isStaff
      ? [
          { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: <ChartIcon className="h-3.5 w-3.5" /> },
          { label: 'Người tham gia', to: ROUTES.PARTICIPANTS, icon: <UsersIcon className="h-3.5 w-3.5" /> },
        ]
      : []),
    ...(role === 'ROLE_ADMIN'
      ? [{ label: 'Loại sự kiện', to: ROUTES.CATEGORIES, icon: <TagIcon className="h-3.5 w-3.5" /> }]
      : []),
  ];

  const featured = upcoming[0];
  const restUpcoming = upcoming.slice(1, 1 + UPCOMING_LIST_COUNT);

  const skeleton = (rows: number) => (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-2xl bg-white/70" />
      ))}
    </div>
  );

  return (
    <div className="min-h-full bg-scene p-4 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1400px] space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-3xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-700 shadow-glass backdrop-blur-xl"
          >
            {error}
          </div>
        )}

        {/* ============================= Thẻ chào ============================= */}
        <Glass className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-bold capitalize text-ink-muted shadow-raise">
                <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(now)}
              </span>

              <h1 className="mt-3.5 text-[30px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[38px]">
                Xin chào{user ? `, ${user.fullName}` : ''} 👋
              </h1>
              <p className="mt-2 max-w-lg text-[14px] leading-6 text-ink-muted">{heroLine}</p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                to={ROUTES.EVENTS}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[13.5px] font-bold text-white shadow-raise-lg transition-all duration-150 hover:-translate-y-0.5 hover:bg-ink-soft active:translate-y-0 active:scale-[0.97]"
              >
                <CalendarIcon className="h-4 w-4" />
                Xem lịch sự kiện
              </Link>
              {isStaff ? (
                <Link
                  to={ROUTES.EVENT_CREATE}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[13.5px] font-bold text-ink shadow-raise transition-all duration-150 hover:-translate-y-0.5 hover:border-ink hover:shadow-raise-lg active:translate-y-0 active:scale-[0.97]"
                >
                  <PlusIcon className="h-4 w-4" />
                  Tạo sự kiện
                </Link>
              ) : (
                <Link
                  to={ROUTES.MY_REGISTRATIONS}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[13.5px] font-bold text-ink shadow-raise transition-all duration-150 hover:-translate-y-0.5 hover:shadow-raise-lg active:translate-y-0 active:scale-[0.97]"
                >
                  <TicketIcon className="h-4 w-4" />
                  Sự kiện của tôi
                </Link>
              )}
            </div>
          </div>

          <nav aria-label="Lối tắt" className="mt-4 flex flex-wrap gap-1.5">
            {shortcuts.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-[12px] font-semibold text-ink-muted shadow-raise transition-all duration-150 hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white hover:shadow-raise-lg active:translate-y-0 active:scale-[0.97]"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/*
            Dải bảy ngày tới: hàng trên là số sự kiện của ngày đó, hàng dưới là thứ. Bấm
            vào mở lịch đúng ngày — thay cho lịch tháng thu nhỏ, gọn hơn nhiều mà vẫn trả
            lời được câu hỏi hay gặp nhất: "tuần này ngày nào bận".
          */}
          <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-white/70 pt-4 sm:grid-cols-7">
            {dayStrip.map(({ day, count, isToday }) => (
              <Link
                key={day.getTime()}
                to={`${ROUTES.EVENTS}?week=${toDateParam(day)}`}
                aria-label={`Mở lịch ngày ${day.getDate()}/${day.getMonth() + 1}, ${count} sự kiện`}
                className={[
                  'flex flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 transition-all duration-200',
                  isToday
                    ? 'border-ink bg-ink text-white shadow-raise-lg'
                    : 'bg-white text-ink shadow-raise hover:-translate-y-1 hover:shadow-raise-lg',
                  // Ngày có sự kiện được viền chàm để nhìn lướt là thấy tuần này bận chỗ nào
                  !isToday && count > 0 ? 'border-indigo-200 hover:border-indigo-400' : '',
                  !isToday && count === 0 ? 'border-slate-200' : '',
                ].join(' ')}
              >
                <span className={`text-[19px] font-extrabold tabular-nums ${isToday ? 'text-white' : count > 0 ? 'text-ink' : 'text-slate-300'}`}>
                  {count}
                </span>
                <span className={`text-[11px] font-bold ${isToday ? 'text-white/75' : 'text-slate-400'}`}>
                  {isToday ? 'Hôm nay' : WEEKDAY_LABELS[(day.getDay() + 6) % 7]}
                </span>
              </Link>
            ))}
          </div>
        </Glass>

        {/* ========================== Lưới thẻ kính ========================== */}
        <SortableGrid
          key={layoutKey}
          storageKey={CARD_ORDER_KEY}
          ariaLabel="Các thẻ của trang chủ"
          className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2"
          blocks={[
            {
              id: 'next',
              title: 'Sự kiện tiếp theo',
              content: (
                <Glass className="p-4 sm:p-5">
                  <GlassTitle title="Sự kiện tiếp theo" action={<GlassAction to={ROUTES.EVENTS} label="Xem tất cả sự kiện" />} />

                  {loading ? (
                    <div className="h-36 animate-pulse rounded-2xl bg-white/70" />
                  ) : !featured ? (
                    <div className="py-10 text-center">
                      <p className="text-[13.5px] font-semibold text-ink">Chưa có sự kiện nào sắp diễn ra</p>
                      <p className="mt-1 text-[12.5px] text-ink-muted">
                        {isStaff ? 'Tạo sự kiện mới để bắt đầu nhận đăng ký.' : 'Hãy quay lại sau nhé.'}
                      </p>
                    </div>
                  ) : (
                    <Link
                      to={ROUTES.EVENT_DETAIL.replace(':id', String(featured.id))}
                      className="group block rounded-2xl border border-indigo-200 bg-white p-4 shadow-raise transition-all duration-200 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-raise-lg"
                    >
                      <span className="flex items-start gap-4">
                        <span className="shrink-0">
                          <span className="block text-[38px] font-extrabold leading-none tracking-tight text-ink">
                            {formatHhMm(featured.startAt)}
                          </span>
                          <span className="mt-1.5 inline-flex h-6 items-center rounded-full bg-ink px-2.5 text-[11px] font-bold text-white">
                            {countdownLabel(featured.startAt, now)}
                          </span>
                        </span>

                        <span className="min-w-0 flex-1 border-l border-slate-100 pl-4">
                          <span className="block truncate text-[11px] font-semibold text-slate-400">
                            {featured.categoryName ?? 'Chưa phân loại'}
                          </span>
                          <span className="block truncate text-[16px] font-bold text-ink group-hover:underline">
                            {featured.name}
                          </span>
                          <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-muted">
                            <ClockIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{formatDateTime(featured.startAt)}</span>
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-muted">
                            <PinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{featured.location}</span>
                          </span>
                          {featured.availableSeats !== null && (
                            <span className="mt-2 inline-flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-[11px] font-semibold text-ink-muted">
                              còn {Math.max(0, featured.availableSeats)} chỗ
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  )}
                </Glass>
              ),
            },
            {
              id: 'stats',
              title: 'Số liệu nhanh',
              content: (
                <Glass className="p-4 sm:p-5">
                  <GlassTitle title="Số liệu nhanh" />
                  <div className={`grid gap-2.5 ${stats.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {stats.map((item) => (
                      <StatTile key={item.label} {...item} />
                    ))}
                  </div>
                </Glass>
              ),
            },
            {
              id: 'upcoming',
              title: 'Sắp diễn ra',
              content: (
                <Glass className="p-4 sm:p-5">
                  <GlassTitle title="Sắp diễn ra" action={<GlassAction to={ROUTES.EVENTS} label="Xem tất cả sự kiện sắp diễn ra" />} />

                  {loading ? (
                    skeleton(3)
                  ) : restUpcoming.length === 0 ? (
                    <p className="py-8 text-center text-[12.5px] text-ink-muted">
                      {featured ? 'Không còn sự kiện nào khác trong 60 ngày tới.' : 'Chưa có sự kiện nào sắp diễn ra.'}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {restUpcoming.map((event) => (
                        <li key={event.id}>
                          <Link
                            to={ROUTES.EVENT_DETAIL.replace(':id', String(event.id))}
                            className="group flex items-center gap-3 rounded-2xl border border-amber-200 bg-white p-3 shadow-raise transition-all duration-200 hover:-translate-y-1 hover:border-amber-400 hover:shadow-raise-lg"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[10.5px] font-semibold text-slate-400">
                                {event.categoryName ?? 'Chưa phân loại'}
                              </span>
                              <span className="block truncate text-[13.5px] font-bold text-ink group-hover:underline">
                                {event.name}
                              </span>
                              <span className="block truncate text-[11px] text-ink-muted">{event.location}</span>
                            </span>
                            <span className="shrink-0 text-right">
                              <span className="block text-[15px] font-extrabold leading-none tabular-nums text-ink">
                                {formatHhMm(event.startAt)}
                              </span>
                              <span className="mt-1 block text-[10.5px] font-semibold text-slate-400">
                                {countdownLabel(event.startAt, now)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Glass>
              ),
            },
            {
              id: 'mine',
              title: 'Lịch của tôi',
              content: (
                <Glass className="p-4 sm:p-5">
                  <GlassTitle title="Lịch của tôi" action={<GlassAction to={ROUTES.MY_REGISTRATIONS} label="Xem tất cả sự kiện đã đăng ký" />} />

                  {loading ? (
                    skeleton(2)
                  ) : myRegistrations.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-[12.5px] font-semibold text-ink">Bạn chưa đăng ký sự kiện nào</p>
                      <Link
                        to={ROUTES.EVENTS}
                        className="mt-3 inline-flex h-9 items-center rounded-full bg-ink px-4 text-[12.5px] font-bold text-white shadow-raise transition-all duration-150 hover:-translate-y-0.5 hover:bg-ink-soft hover:shadow-raise-lg active:translate-y-0 active:scale-[0.97]"
                      >
                        Khám phá sự kiện
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {myRegistrations.slice(0, SCHEDULE_ITEM_COUNT).map((item) => (
                        <li key={item.registrationId}>
                          <Link
                            to={ROUTES.EVENT_DETAIL.replace(':id', String(item.eventId))}
                            className="group flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-3 shadow-raise transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-raise-lg"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px] font-bold text-ink group-hover:underline">
                                {item.eventName}
                              </span>
                              <span className="block truncate text-[11px] text-ink-muted">
                                {formatDateTime(item.startAt)} · {item.location}
                              </span>
                            </span>
                            <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-ink" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Glass>
              ),
            },
          ]}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetLayout}
            title="Đưa các thẻ về vị trí ban đầu"
            className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3.5 text-[11.5px] font-bold text-ink-muted shadow-raise transition-all duration-150 hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white hover:shadow-raise-lg active:translate-y-0 active:scale-[0.97]"
          >
            Bố cục mặc định
          </button>
        </div>
      </div>
    </div>
  );
}
