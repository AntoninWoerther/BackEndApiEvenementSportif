import { AppError } from '../../../core/errors/app.error';


export class InvalidRefreshTokenError extends AppError {
    constructor() {
        super(
            'Le jeton de renouvellement est inutilisable.',
            'AUTH_003'
        );
    }
}