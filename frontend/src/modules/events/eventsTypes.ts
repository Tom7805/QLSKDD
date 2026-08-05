export interface EventDetail {
  id: number;
  name: string;
  description: string | null;
  location: string;
  capacity: number;
  startAt: string;
  endAt: string;
  status: string;
  categoryId: number;
  categoryName: string | null;
  createdBy: string;
  createdAt: string;
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
