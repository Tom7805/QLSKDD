export interface DashboardStat {
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalCheckIns: number;
  attendanceRate: number;
}

export interface TopEvent {
  eventId: number;
  eventName: string;
  capacity: number | null;
  registered: number;
  fillRate: number | null;
}
