import { AppError } from '../../../core/http/error.response';


export class InvalidRefreshTokenError extends AppError {
    constructor() {
        super(
            'Refresh Token invalide.',
            401,
            'AUTH_003'
        );
    }
}