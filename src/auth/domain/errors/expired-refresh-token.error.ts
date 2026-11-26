import { AppError } from '../../../core/errors/app.error';


export class ExpiredRefreshTokenError extends AppError {
    constructor() {
        super(
            'Le jeton de renouvellement a expiré.',
            'AUTH_005'
        );
    }
}