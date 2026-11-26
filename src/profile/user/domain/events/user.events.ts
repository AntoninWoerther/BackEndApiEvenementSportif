
export const USER_EVENTS = {
    USER_CREATED: 'user.created',
    USER_DELETED: 'user.deleted',
    USER_SIGNUP_DUPLICATE: 'user.signup.duplicate',
} as const;

export interface UserEvents {
    [USER_EVENTS.USER_CREATED]: string;
    [USER_EVENTS.USER_DELETED]: string;
    [USER_EVENTS.USER_SIGNUP_DUPLICATE]: string;
}
