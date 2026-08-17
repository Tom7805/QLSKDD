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
  totalRegistered: number | null;
  availableSeats: number | null;
  attendanceRate: number | null;
  registered: boolean;
}

export interface EventSummary {
  id: number;
  name: string;
  location: string;
  startAt: string;
  endAt: string;
  status: EventStatus;
  capacity: number | null;
  availableSeats: number | null;
  attendanceRate: number | null;
  // Lịch tuần tô màu khối sự kiện theo loại; null với sự kiện chưa gán loại
  categoryId: number | null;
  categoryName: string | null;
}

export interface EventsPage {
  content: EventSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
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
