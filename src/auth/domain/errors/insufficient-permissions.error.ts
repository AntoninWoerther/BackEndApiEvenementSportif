import { AppError } from '../../../core/http/error.response';

export class InsufficientPermissionsError extends AppError {
    constructor(message = 'Vous n’avez pas les permissions nécessaires.') {
        super(message, 403, 'AUTH_006');
    }
}
