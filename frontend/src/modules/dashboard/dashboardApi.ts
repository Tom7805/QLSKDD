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
