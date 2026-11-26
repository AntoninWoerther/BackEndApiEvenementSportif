import { AppError } from '../../../core/http/error.response';

export class InvalidCredentialsError extends AppError {
    constructor() {
        super(
            'Email ou mot de passe incorrect.',
            401,
            'AUTH_001'
        );
    }
}