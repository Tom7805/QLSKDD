import apiClient from '../../configs/apiClient';
import type { ApiResponse } from '../auth/authTypes';
import type { DashboardStat, TopEvent } from './dashboardTypes';

export const getDashboardSummary = (): Promise<DashboardStat> =>
  apiClient
    .get<ApiResponse<DashboardStat>>('/dashboard/summary')
    .then((response) => response.data.data);

export const getTopEvents = (limit = 5): Promise<TopEvent[]> =>
  apiClient
    .get<ApiResponse<TopEvent[]>>('/dashboard/top-events', { params: { limit } })
    .then((response) => response.data.data);

// B5.5-T4: gọi API xuất báo cáo CSV theo khoảng thời gian. Backend trả về file nhị phân
// (text/csv) nên phải dùng responseType: 'blob' — nếu không axios sẽ cố parse thành JSON
// và làm hỏng dữ liệu file. from/to định dạng yyyy-MM-dd.
export const exportEventsCsv = (from: string, to: string): Promise<Blob> =>
  apiClient
    .get<Blob>('/reports/events/export', {
      params: { from, to },
      responseType: 'blob',
    })
    .then((response) => response.data);
