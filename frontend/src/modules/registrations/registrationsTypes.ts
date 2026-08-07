export interface RegistrationCreateResponse {
  registrationId: number;
  code: string;
  eventName: string;
}

export interface MyRegistration {
  registrationId: number;
  code: string;
  registrationStatus: 'ACTIVE' | 'CANCELLED';
  registeredAt: string;
  eventId: number;
  eventName: string;
  location: string;
  startAt: string;
  endAt: string;
  eventStatus: 'OPEN' | 'CLOSED' | 'CANCELLED';
  canCancel: boolean;
}

export interface PaginationResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface RegistrationsPage extends PaginationResponse<MyRegistration> {}

export interface EventRegistrationItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  registeredAt: string;
  status: 'ACTIVE' | 'CANCELLED';
  checkedIn: boolean;
}

export interface EventRegistrationsResponse {
  registrations: PaginationResponse<EventRegistrationItem>;
  summary: {
    totalRegistered: number;
    capacity: number | null;
  };
}
