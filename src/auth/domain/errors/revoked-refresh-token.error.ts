import { AppError } from '../../../core/http/error.response';


export class RevokedRefreshTokenError extends AppError {
    constructor() {
        super(
            'Le jeton de renouvellement a été révoqué.',
            401,
            'AUTH_004'
        );
    }
}