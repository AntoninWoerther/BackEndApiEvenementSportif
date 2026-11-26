import { AppError } from '../../../core/errors/app.error';


export class RevokedRefreshTokenError extends AppError {
    constructor() {
        super(
            'Le jeton de renouvellement a été révoqué.',
            'AUTH_004'
        );
    }
}