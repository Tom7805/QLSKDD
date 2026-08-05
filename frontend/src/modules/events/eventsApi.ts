import apiClient from '../../configs/apiClient';
import type { ApiResponse } from '../auth/authTypes';
import type { EventCreateRequest, EventDetail } from './eventsTypes';

const EVENTS_BASE_URL = '/events';

export const createEvent = (request: EventCreateRequest): Promise<EventDetail> =>
  apiClient
    .post<ApiResponse<EventDetail>>(EVENTS_BASE_URL, request)
    .then((response) => response.data.data);
