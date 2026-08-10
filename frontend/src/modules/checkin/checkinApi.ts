import apiClient from '../../configs/apiClient';
import type { ApiResponse } from '../auth/authTypes';
import type { CheckInRequest, CheckInResponse } from './checkinTypes';

export const checkInParticipant = (request: CheckInRequest): Promise<CheckInResponse> =>
  apiClient
    .post<ApiResponse<CheckInResponse>>('/check-in', request)
    .then((response) => response.data.data);
