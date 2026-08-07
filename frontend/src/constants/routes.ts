export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FORBIDDEN: '/403',
  USERS: '/users',
  CATEGORIES: '/categories',
  EVENTS: '/events',
  MY_REGISTRATIONS: '/my-registrations',
  EVENT_CREATE: '/events/new',
  EVENT_EDIT: '/events/:id/edit',
  EVENT_DETAIL: '/events/:id',
  CHANGE_PASSWORD: '/change-password',
} as const;
