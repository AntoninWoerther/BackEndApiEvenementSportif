import { AppError } from '../../../../core/errors/app.error';

export class InvalidUserPermissionsError extends AppError {
    constructor() {
        super('Valeur de permissions invalide.', 'USER_006');
    }
}
