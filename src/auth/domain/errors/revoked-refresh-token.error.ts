import { AppError } from '../../../core/http/error.response';


export class RevokedRefreshTokenError extends AppError {
    constructor() {
        super(
            'Refresh Token revoked.',
            401,
            'AUTH_004'
        );
    }
}