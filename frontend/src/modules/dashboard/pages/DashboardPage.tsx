import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardSummary, getTopEvents } from '../dashboardApi';
import type { DashboardStat, TopEvent } from '../dashboardTypes';
import StatCard from '../components/StatCard';
import TopEventsTable from '../components/TopEventsTable';
import { ROUTES } from '../../../constants/routes';

const BAR_COLOR = '#1c5cab';
const AXIS_LABEL_MAX_CHARS = 10;

function truncateLabel(name: string) {
  return name.length > AXIS_LABEL_MAX_CHARS ? `${name.slice(0, AXIS_LABEL_MAX_CHARS)}…` : name;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stat, setStat] = useState<DashboardStat | null>(null);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const isEmpty = !loading && stat !== null && topEvents.length === 0;

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

  const statCards = [
    { label: 'Tổng sự kiện', value: stat?.totalEvents ?? 0 },
    { label: 'Sắp diễn ra', value: stat?.upcomingEvents ?? 0 },
    { label: 'Lượt đăng ký', value: stat?.totalRegistrations ?? 0 },
    { label: 'Tỷ lệ điểm danh', value: stat ? `${stat.attendanceRate}%` : '0%' },
  ];

  const chartData = useMemo(
    () =>
      topEvents.map((e) => ({
        name: e.eventName,
        registered: e.registered,
        eventId: e.eventId,
      })),
    [topEvents],
  );

  const cardLoading = loading || stat === null;

  const handleRowClick = (eventId: number) => {
    navigate(ROUTES.EVENT_DETAIL.replace(':id', String(eventId)));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <p className="text-sm font-semibold text-blue-600">Tổng quan</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Dashboard</h1>
        </header>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-3 font-semibold text-blue-700"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <section aria-label="Số liệu thống kê">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                  <StatCard key={card.label} label={card.label} value={card.value} loading={cardLoading} />
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Top 5 sự kiện đăng ký nhiều người</h2>
              <TopEventsTable events={topEvents} loading={cardLoading} onRowClick={handleRowClick} />
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Biểu đồ đăng ký theo sự kiện</h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {cardLoading ? (
                  <div className="flex items-end gap-2 overflow-x-auto py-4">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={`bar-skel-${i}`} className="h-6 w-10 shrink-0 animate-pulse rounded bg-slate-200" />
                    ))}
                  </div>
                ) : isEmpty ? (
                  <div className="py-10 text-center text-slate-500">Chưa có sự kiện nào.</div>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 0, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="name"
                          tickFormatter={truncateLabel}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          height={36}
                        />
                        <YAxis
                          domain={[0, 'dataMax + 5']}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                          width={32}
                        />
                        <Tooltip
                          isAnimationActive={false}
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ fontSize: 12, borderRadius: 6 }}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                        />
                        <Bar
                          dataKey="registered"
                          fill={BAR_COLOR}
                          radius={[6, 6, 0, 0]}
                          isAnimationActive={false}
                          className="cursor-pointer transition-opacity hover:opacity-90"
                          onClick={(data) => {
                            const eventId = (data?.payload as { eventId?: number } | undefined)?.eventId;
                            if (eventId) handleRowClick(eventId);
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
