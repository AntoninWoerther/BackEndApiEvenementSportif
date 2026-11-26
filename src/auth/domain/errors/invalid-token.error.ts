import { AppError } from '../../../core/errors/app.error';


export class InvalidTokenError extends AppError {
    constructor(message = 'Token invalide.') {
        super(
            message,
            'AUTH_002'
        );
    }
}