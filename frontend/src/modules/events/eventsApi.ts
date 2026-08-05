import apiClient from '../../configs/apiClient';
import type { ApiResponse } from '../auth/authTypes';
import type { EventCreateRequest, EventDetail, EventsPage, EventStatusRequest } from './eventsTypes';

const EVENTS_BASE_URL = '/events';

export const getEvents = (page = 0, size = 9): Promise<EventsPage> =>
  apiClient
    .get<ApiResponse<EventsPage>>(EVENTS_BASE_URL, { params: { page, size } })
    .then((response) => response.data.data);

export const createEvent = (request: EventCreateRequest): Promise<EventDetail> =>
  apiClient
    .post<ApiResponse<EventDetail>>(EVENTS_BASE_URL, request)
    .then((response) => response.data.data);

export const getEventById = (id: number): Promise<EventDetail> =>
  apiClient.get<ApiResponse<EventDetail>>(`${EVENTS_BASE_URL}/${id}`).then((response) => response.data.data);

export const updateEvent = (id: number, request: EventCreateRequest): Promise<EventDetail> =>
  apiClient.put<ApiResponse<EventDetail>>(`${EVENTS_BASE_URL}/${id}`, request).then((response) => response.data.data);

export const changeEventStatus = (id: number, request: EventStatusRequest): Promise<EventDetail> =>
  apiClient
    .patch<ApiResponse<EventDetail>>(`${EVENTS_BASE_URL}/${id}/status`, request)
    .then((response) => response.data.data);
