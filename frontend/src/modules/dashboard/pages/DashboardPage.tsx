import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ChartIcon,
  CheckSquareIcon,
  SparkIcon,
  TicketIcon,
  TrendingUpIcon,
} from '../../../components/common/Icons';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { ROUTES } from '../../../constants/routes';
import { selectUser } from '../../../stores/slices/authSlice';
import { useAppSelector } from '../../../stores/store';
import ExportReportPanel from '../components/ExportReportPanel';
import SortableGrid, { type SortableBlock } from '../../../components/ui/SortableGrid';
import StatCard, { type StatCardProps } from '../components/StatCard';
import TopEventsChart from '../components/TopEventsChart';
import TopEventsTable from '../components/TopEventsTable';
import { getDashboardSummary, getTopEvents } from '../dashboardApi';
import type { DashboardStat, TopEvent } from '../dashboardTypes';

/** Khoá localStorage nhớ thứ tự thẻ người dùng đã sắp */
const STAT_ORDER_KEY = 'qlskdd.dashboard.statOrder';
const PANEL_ORDER_KEY = 'qlskdd.dashboard.panelOrder';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [stat, setStat] = useState<DashboardStat | null>(null);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** Đổi khoá này là hai lưới được dựng lại và đọc lại thứ tự (lúc này đã trống) */
  const [layoutKey, setLayoutKey] = useState(0);

  const resetLayout = () => {
    try {
      localStorage.removeItem(STAT_ORDER_KEY);
      localStorage.removeItem(PANEL_ORDER_KEY);
    } catch {
      // Trình duyệt chặn localStorage — vẫn đưa bố cục về mặc định cho phiên hiện tại
    }
    setLayoutKey((key) => key + 1);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([getDashboardSummary(), getTopEvents(5)])
      .then(([statData, eventsData]) => {
        if (!active) return;
        setStat(statData);
        setTopEvents(eventsData);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.data?.message
          : undefined;
        setError(message ?? 'Không thể tải dữ liệu dashboard.');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const cardLoading = loading || stat === null;
  const handleRowClick = (eventId: number) => navigate(ROUTES.EVENT_DETAIL.replace(':id', String(eventId)));

  const today = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date());
  const attendanceRate = stat?.attendanceRate ?? 0;
  const attendanceTone: StatCardProps['progressTone'] =
    attendanceRate < 50 ? 'red' : attendanceRate <= 80 ? 'amber' : 'emerald';

  /**
   * Dòng phụ của mỗi thẻ nêu ngữ cảnh lấy từ chính dữ liệu API trả về (không bịa ra
   * kiểu "+71% so với tuần trước" vì backend chưa có số liệu theo thời gian để so sánh).
   */
  const statCards = [
    {
      label: 'Tổng sự kiện',
      value: stat?.totalEvents ?? 0,
      icon: <CalendarIcon className="h-4 w-4" />,
      hint: stat ? `${stat.upcomingEvents} sự kiện sắp diễn ra` : null,
      progress: null,
      tone: 'indigo' as const,
      to: ROUTES.EVENTS,
    },
    {
      label: 'Sắp diễn ra',
      value: stat?.upcomingEvents ?? 0,
      icon: <SparkIcon className="h-4 w-4" />,
      hint: stat && stat.totalEvents > 0
        ? `Chiếm ${Math.round((stat.upcomingEvents / stat.totalEvents) * 100)}% tổng số sự kiện`
        : 'Chưa có sự kiện nào',
      progress: null,
      tone: 'amber' as const,
      to: ROUTES.EVENTS,
    },
    {
      label: 'Lượt đăng ký',
      value: stat?.totalRegistrations ?? 0,
      icon: <TicketIcon className="h-4 w-4" />,
      hint: stat ? `${stat.totalCheckIns} lượt đã điểm danh` : null,
      progress: null,
      tone: 'sky' as const,
      to: ROUTES.PARTICIPANTS,
    },
    {
      label: 'Tỷ lệ điểm danh',
      value: `${attendanceRate}%`,
      icon: <CheckSquareIcon className="h-4 w-4" />,
      hint: stat ? `${stat.totalCheckIns}/${stat.totalRegistrations} lượt có mặt` : null,
      progress: attendanceRate,
      progressTone: attendanceTone,
      tone: 'emerald' as const,
      to: ROUTES.PARTICIPANTS,
    },
  ];

  /**
   * Ba khối lớn có bề rộng 2 + 1 + 3 trên lưới 3 cột, nên xếp theo thứ tự nào thì tổng
   * bề rộng cũng lấp kín hàng — người dùng đổi chỗ thoải mái mà lưới không bao giờ hở.
   */
  const panelBlocks: SortableBlock[] = [
    {
      id: 'chart',
      title: 'Lượt đăng ký theo sự kiện',
      className: 'xl:col-span-2',
      content: (
        <Card floating className="h-full border-indigo-200/80">
          <CardHeader
            icon={<ChartIcon className="h-4 w-4" />}
            title="Lượt đăng ký theo sự kiện"
            subtitle="Rê chuột vào từng cột để xem số liệu chi tiết"
            actions={
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-ink-muted">
                Top {topEvents.length || 5}
              </span>
            }
          />
          <CardBody className="pt-2">
            <TopEventsChart events={topEvents} loading={cardLoading} onSelect={handleRowClick} />
          </CardBody>
        </Card>
      ),
    },
    {
      id: 'export',
      title: 'Xuất báo cáo CSV',
      content: <ExportReportPanel />,
    },
    {
      id: 'table',
      title: 'Top sự kiện đăng ký nhiều nhất',
      className: 'xl:col-span-3',
      content: (
        <Card floating className="h-full overflow-hidden border-sky-200/80">
          <CardHeader
            icon={<TrendingUpIcon className="h-4 w-4" />}
            title="Top sự kiện đăng ký nhiều nhất"
            subtitle="Bấm tiêu đề cột để sắp xếp, bấm dòng để mở chi tiết"
          />
          <TopEventsTable events={topEvents} loading={cardLoading} onRowClick={handleRowClick} />
        </Card>
      ),
    },
  ];

  const statBlocks: SortableBlock[] = statCards.map((card) => ({
    id: card.label,
    title: card.label,
    content: (
      <StatCard
        label={card.label}
        value={card.value}
        icon={card.icon}
        hint={card.hint}
        progress={card.progress}
        progressTone={card.progressTone}
        tone={card.tone}
        to={card.to}
        loading={cardLoading}
      />
    ),
  }));

  return (
    /*
      Nền có màu (chuyển sắc tím nhạt) chứ không để trắng: các thẻ đều màu trắng nên chỉ
      khi nền khác màu chúng mới thật sự "nổi" lên thành từng khối rời, thay vì tan vào
      nền và phải nhờ đường viền mới phân biệt được.
    */
    <div className="min-h-full bg-scene p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
              Xin chào{user ? `, ${user.fullName}` : ''} 👋
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              Đây là bức tranh tổng quan — kéo tay cầm ở mép trên mỗi thẻ để sắp lại theo ý bạn.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold capitalize text-ink-muted shadow-raise">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              {today}
            </span>
            <button
              type="button"
              onClick={resetLayout}
              title="Đưa các thẻ về vị trí ban đầu"
              className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3.5 text-xs font-bold text-ink-muted transition-all duration-150 hover:border-ink hover:bg-ink hover:text-white raise"
            >
              Bố cục mặc định
            </button>
          </div>
        </header>

        {error ? (
          <div role="alert" className="animate-rise rounded-3xl bg-red-50 p-8 text-center text-red-700 shadow-float">
            <p className="font-medium">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-3 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-ink-soft active:scale-[0.97] raise"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="animate-rise space-y-6">
            <SortableGrid
              key={`stats-${layoutKey}`}
              storageKey={STAT_ORDER_KEY}
              ariaLabel="Số liệu thống kê"
              blocks={statBlocks}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
            />

            <SortableGrid
              key={`panels-${layoutKey}`}
              storageKey={PANEL_ORDER_KEY}
              ariaLabel="Các khối biểu đồ và báo cáo"
              blocks={panelBlocks}
              className="grid grid-cols-1 gap-6 xl:grid-cols-3"
            />
          </div>
        )}
      </div>
    </div>
  );
}
