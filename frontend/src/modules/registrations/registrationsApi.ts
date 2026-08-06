import apiClient from '../../configs/apiClient';
import type { ApiResponse } from '../auth/authTypes';
import type { RegistrationCreateResponse } from './registrationsTypes';

const REGISTRATIONS_BASE_URL = '/registrations';

export const registerForEvent = (eventId: number): Promise<RegistrationCreateResponse> =>
  apiClient
    .post<ApiResponse<RegistrationCreateResponse>>(REGISTRATIONS_BASE_URL, { eventId })
    .then((response) => response.data.data);
