import { AppError } from '../../../../core/errors/app.error';

export class IncorrectCurrentPasswordError extends AppError {
    constructor() {
        super('L’ancien mot de passe est incorrect.', 'USER_004');
    }
}
