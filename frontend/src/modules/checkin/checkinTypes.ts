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

export interface AttendanceItem {
  registrationId: number;
  fullName: string;
  email: string;
  phone: string | null;
  registeredAt: string;
  checkedInAt: string | null;
}

export interface AttendanceSummary {
  totalRegistered: number;
  present: number;
  absent: number;
  attendanceRate: number;
}

export interface AttendanceSummaryResponse {
  summary: AttendanceSummary;
  present: AttendanceItem[];
  absent: AttendanceItem[];
}
