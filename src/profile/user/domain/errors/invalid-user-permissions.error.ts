import { AppError } from '../../../../core/http/error.response';

export class InvalidUserPermissionsError extends AppError {
    constructor() {
        super('Valeur de permissions invalide.', 400, 'USER_006');
    }
}
