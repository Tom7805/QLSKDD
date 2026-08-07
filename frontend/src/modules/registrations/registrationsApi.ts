import apiClient from '../../configs/apiClient';
import type { ApiResponse } from '../auth/authTypes';
import type { RegistrationCreateResponse, RegistrationsPage } from './registrationsTypes';

const REGISTRATIONS_BASE_URL = '/registrations';

export const registerForEvent = (eventId: number): Promise<RegistrationCreateResponse> =>
  apiClient
    .post<ApiResponse<RegistrationCreateResponse>>(REGISTRATIONS_BASE_URL, { eventId })
    .then((response) => response.data.data);

export const getMyRegistrations = (page = 0, size = 10): Promise<RegistrationsPage> =>
  apiClient
    .get<ApiResponse<RegistrationsPage>>(`${REGISTRATIONS_BASE_URL}/me`, { params: { page, size } })
    .then((response) => response.data.data);

export const cancelRegistration = (registrationId: number): Promise<void> =>
  apiClient.delete<ApiResponse<void>>(`${REGISTRATIONS_BASE_URL}/${registrationId}`).then(() => undefined);
