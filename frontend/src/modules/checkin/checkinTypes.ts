import type { EventRegistrationItem } from '../registrations/registrationsTypes';

export type CheckInParticipant = EventRegistrationItem & { checkedInAt?: string };

export interface CheckInRequest {
  registrationId: number;
  eventId: number;
}

export interface CheckInResponse {
  status: 'SUCCESS';
  message: string;
  participantName: string;
  checkedInAt: string;
}

export interface CheckInErrorResponse {
  message?: string;
  errorCode?: 'ALREADY_CHECKED_IN' | 'INVALID_TICKET' | 'WRONG_EVENT' | string;
}
