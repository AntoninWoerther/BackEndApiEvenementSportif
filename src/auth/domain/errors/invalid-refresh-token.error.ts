import { AppError } from '../../../core/http/error.response';


export class InvalidRefreshTokenError extends AppError {
    constructor() {
        super(
            'Le jeton de renouvellement est invalide.',
            401,
            'AUTH_003'
        );
    }
}