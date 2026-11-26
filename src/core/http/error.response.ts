import type { AppError } from '../errors/app.error';

const statusByErrorCode = new Map<string, number>([
    ['AUTH_001', 401],
    ['AUTH_002', 401],
    ['AUTH_003', 401],
    ['AUTH_004', 401],
    ['AUTH_005', 401],
    ['AUTH_006', 403],

    ['USER_001', 404],
    ['USER_002', 409],
    ['USER_003', 400],
    ['USER_004', 403],
    ['USER_005', 409],
    ['USER_006', 400],
    ['USER_007', 403],

    ['EVENEMENT_001', 404],
    ['EVENEMENT_002', 400],
    ['EVENEMENT_003', 404],
    ['EVENEMENT_004', 403],
    ['EVENEMENT_005', 403],
    ['EVENEMENT_006', 403],
    ['EVENEMENT_007', 409],
    ['EVENEMENT_008', 403],
    ['EVENEMENT_009', 409],

    ['RESERVATION_001', 409],
    ['RESERVATION_002', 409],
    ['RESERVATION_003', 404],
    ['RESERVATION_004', 404],
    ['RESERVATION_005', 409],

    ['WAITLIST_001', 409],
    ['WAITLIST_002', 409],
    ['WAITLIST_003', 404],
    ['WAITLIST_004', 400],

    ['ERR_BODY_ENCODING', 415],
    ['ERR_BODY_TOO_LARGE', 413],
    ['ERR_INVALID_URL', 400],
    ['ERR_ROUTE_NOT_FOUND', 404],
    ['ERR_VALI_400', 400],

    ['err-00-500', 500],
]);

export const getHttpErrorStatus = (errorid: string): number | undefined => statusByErrorCode.get(errorid);

export const presentHttpError = (error: AppError, statusCode: number) => {
    return {
        statusCode,
        idcode: error.errorid,
        message: error.message,
        ...(error.meta && { fields: error.meta })
    };
};
