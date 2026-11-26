import { AppError } from '../../../core/errors/app.error';

export class InsufficientPermissionsError extends AppError {
    constructor(message = 'Vous n’avez pas les permissions nécessaires.') {
        super(message, 'AUTH_006');
    }
}
