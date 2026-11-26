import { AppError } from '../../../../core/http/error.response';

export class IncorrectCurrentPasswordError extends AppError {
    constructor() {
        super('L’ancien mot de passe est incorrect.', 403, 'USER_004');
    }
}
