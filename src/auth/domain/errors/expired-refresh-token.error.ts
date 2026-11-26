import { AppError } from '../../../core/http/error.response';


export class ExpiredRefreshTokenError extends AppError {
    constructor() {
        super(
            'Le jeton de renouvellement a expiré.',
            401,
            'AUTH_005'
        );
    }
}