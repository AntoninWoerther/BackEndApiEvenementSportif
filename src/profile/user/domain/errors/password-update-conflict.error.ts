import { AppError } from '../../../../core/http/error.response';

export class PasswordUpdateConflictError extends AppError {
    constructor() {
        super('Le compte a changé pendant la mise à jour. Réessayez.', 409, 'USER_005');
    }
}
