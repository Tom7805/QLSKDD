import type { EventStatus } from '../../components/common/EventStatusBadge';

export interface EventDetail {
  id: number;
  name: string;
  description: string | null;
  location: string;
  capacity: number;
  startAt: string;
  endAt: string;
  status: EventStatus;
  categoryId: number;
  categoryName: string | null;
  createdBy: string;
  createdAt: string;
}

export interface EventStatusRequest {
  status: EventStatus;
}

export interface EventCreateRequest {
  name: string;
  description?: string | null;
  location: string;
  capacity: number;
  startAt: string;
  endAt: string;
  categoryId: number;
}
