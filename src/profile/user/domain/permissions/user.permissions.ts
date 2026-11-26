export const USER_PERMISSIONS = {
    CREATE_EVENT: 1,
    UPDATE_EVENT: 2,
    UPDATE_ACCOUNT: 4,
    DELETE_ACCOUNT: 8,
    SUPERUSER: 16,
    UPDATE_OTHER_EVENTS: 32,
    REMOVE_EVENT_PARTICIPANTS: 64
} as const;

export type UserPermission = typeof USER_PERMISSIONS[keyof typeof USER_PERMISSIONS];

export const DEFAULT_USER_PERMISSIONS = USER_PERMISSIONS.CREATE_EVENT |
    USER_PERMISSIONS.UPDATE_EVENT | USER_PERMISSIONS.UPDATE_ACCOUNT;

export const ALL_USER_PERMISSIONS = DEFAULT_USER_PERMISSIONS |
    USER_PERMISSIONS.DELETE_ACCOUNT | USER_PERMISSIONS.SUPERUSER |
    USER_PERMISSIONS.UPDATE_OTHER_EVENTS | USER_PERMISSIONS.REMOVE_EVENT_PARTICIPANTS;

export const GRANTABLE_USER_PERMISSIONS = [
    USER_PERMISSIONS.CREATE_EVENT,
    USER_PERMISSIONS.UPDATE_EVENT,
    USER_PERMISSIONS.UPDATE_ACCOUNT,
    USER_PERMISSIONS.DELETE_ACCOUNT,
    USER_PERMISSIONS.UPDATE_OTHER_EVENTS,
    USER_PERMISSIONS.REMOVE_EVENT_PARTICIPANTS
] as const;

export type GrantableUserPermission = typeof GRANTABLE_USER_PERMISSIONS[number];

export const isGrantableUserPermission = (value: number): value is GrantableUserPermission => {
    return GRANTABLE_USER_PERMISSIONS.some(permission => permission === value);
};

export const isSuperuser = (permissions: number): boolean => {
    return (permissions & USER_PERMISSIONS.SUPERUSER) === USER_PERMISSIONS.SUPERUSER;
};

export const hasUserPermission = (permissions: number, required: UserPermission): boolean => {
    return isSuperuser(permissions) || (permissions & required) === required;
};
