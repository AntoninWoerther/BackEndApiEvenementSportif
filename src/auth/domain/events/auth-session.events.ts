export const AUTH_SESSION_EVENTS = {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    LOGOUT_ALL: 'LOGOUT_ALL'
} as const;

export type AuthSessionEventType = typeof AUTH_SESSION_EVENTS[keyof typeof AUTH_SESSION_EVENTS];
