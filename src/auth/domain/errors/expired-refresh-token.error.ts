import { AppError } from '../../../core/http/error.response';


export class ExpiredRefreshTokenError extends AppError {
    constructor() {
        super(
            'Refresh Token expired.',
            401,
            'AUTH_005'
        );
    }
}