import apiClient from '../../configs/apiClient';
import type { ApiResponse } from '../auth/authTypes';
import type { EventRegistrationsResponse, RegistrationCreateResponse, RegistrationsPage } from './registrationsTypes';

const REGISTRATIONS_BASE_URL = '/registrations';
const EVENTS_BASE_URL = '/events';

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

export const getEventRegistrations = (eventId: number, page = 0, size = 10): Promise<EventRegistrationsResponse> =>
  apiClient
    .get<ApiResponse<EventRegistrationsResponse>>(`${EVENTS_BASE_URL}/${eventId}/registrations`, { params: { page, size } })
    .then((response) => response.data.data);
