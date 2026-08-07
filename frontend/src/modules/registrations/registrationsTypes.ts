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

export interface RegistrationsPage {
  content: MyRegistration[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
