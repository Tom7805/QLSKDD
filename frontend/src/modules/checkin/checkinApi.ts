import apiClient from '../../configs/apiClient';
import type { ApiResponse } from '../auth/authTypes';
import type {
  AttendanceFilter,
  AttendancePageResponse,
  AttendanceSummaryResponse,
  CheckInRequest,
  CheckInByCodeRequest,
  CheckInResponse,
} from './checkinTypes';

export const checkInParticipant = (request: CheckInRequest): Promise<CheckInResponse> =>
  apiClient
    .post<ApiResponse<CheckInResponse>>('/check-in', request)
    .then((response) => response.data.data);

export const checkInByCode = (request: CheckInByCodeRequest): Promise<CheckInResponse> =>
  apiClient
    .post<ApiResponse<CheckInResponse>>('/check-in/scan', request)
    .then((response) => response.data.data);

export const getAttendanceSummary = (eventId: number): Promise<AttendanceSummaryResponse> =>
  apiClient
    .get<ApiResponse<AttendanceSummaryResponse>>(`/events/${eventId}/attendance-summary`)
    .then((response) => response.data.data);

// B4.4-T4: danh sách điểm danh phân trang, lọc trực tiếp bằng API thật.
export const getAttendanceList = (
  eventId: number,
  status: AttendanceFilter = 'all',
  page = 0,
  size = 10,
): Promise<AttendancePageResponse> =>
  apiClient
    .get<ApiResponse<AttendancePageResponse>>(`/events/${eventId}/attendance`, {
      params: { status, page, size },
    })
    .then((response) => response.data.data);
