import { AppError } from '../../../core/http/error.response';


export class InvalidTokenError extends AppError {
    constructor(message = 'Token invalide.') {
        super(
            message,
            401,
            'AUTH_002'
        );
    }
}