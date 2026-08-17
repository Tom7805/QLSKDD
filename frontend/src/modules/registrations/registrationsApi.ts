import apiClient from '../../configs/apiClient';
import type { ApiResponse } from '../auth/authTypes';
import type { EventRegistrationsResponse, Participant, ParticipantPage, ParticipantRequest, RegistrationCreateResponse, RegistrationsPage } from './registrationsTypes';

const REGISTRATIONS_BASE_URL = '/registrations';
const EVENTS_BASE_URL = '/events';
const PARTICIPANTS_BASE_URL = '/participants';

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

export const getRegistrationQr = (registrationId: number): Promise<Blob> =>
  apiClient
    .get(`${REGISTRATIONS_BASE_URL}/${registrationId}/qr`, { responseType: 'blob' })
    .then((response) => response.data as Blob);

export const getEventRegistrations = (eventId: number, page = 0, size = 10): Promise<EventRegistrationsResponse> =>
  apiClient
    .get<ApiResponse<EventRegistrationsResponse>>(`${EVENTS_BASE_URL}/${eventId}/registrations`, { params: { page, size } })
    .then((response) => response.data.data);

export const getParticipants = (params: { keyword?: string; eventId?: number; page?: number; size?: number } = {}): Promise<ParticipantPage> =>
  apiClient.get<ApiResponse<ParticipantPage>>(PARTICIPANTS_BASE_URL, { params }).then((response) => response.data.data);

export const createParticipant = (request: ParticipantRequest): Promise<Participant> =>
  apiClient.post<ApiResponse<Participant>>(PARTICIPANTS_BASE_URL, request).then((response) => response.data.data);

export const updateParticipant = (id: number, request: ParticipantRequest): Promise<Participant> =>
  apiClient.put<ApiResponse<Participant>>(`${PARTICIPANTS_BASE_URL}/${id}`, request).then((response) => response.data.data);

export const deleteParticipant = (id: number): Promise<void> =>
  apiClient.delete(`${PARTICIPANTS_BASE_URL}/${id}`).then(() => undefined);
