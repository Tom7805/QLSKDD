import apiClient from '../../configs/apiClient';
import type { ApiResponse } from '../auth/authTypes';
import type { AttendanceSummaryResponse, CheckInRequest, CheckInResponse } from './checkinTypes';

export const checkInParticipant = (request: CheckInRequest): Promise<CheckInResponse> =>
  apiClient
    .post<ApiResponse<CheckInResponse>>('/check-in', request)
    .then((response) => response.data.data);

export const getAttendanceSummary = (eventId: number): Promise<AttendanceSummaryResponse> =>
  apiClient
    .get<ApiResponse<AttendanceSummaryResponse>>(`/events/${eventId}/attendance-summary`)
    .then((response) => response.data.data);
