import { AppError } from '../../../core/errors/app.error';

export class InvalidCredentialsError extends AppError {
    constructor() {
        super(
            'Email ou mot de passe incorrect.',
            'AUTH_001'
        );
    }
}