import { AppError } from '../../../../core/errors/app.error';

export class PasswordUpdateConflictError extends AppError {
    constructor() {
        super('Le compte a changé pendant la mise à jour. Réessayez.', 'USER_005');
    }
}
