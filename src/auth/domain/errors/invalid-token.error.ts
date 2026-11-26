import { AppError } from '../../../core/http/error.response';


export class InvalidTokenError extends AppError {
    constructor() {
        super(
            'Token invalide.',
            401,
            'AUTH_002'
        );
    }
}