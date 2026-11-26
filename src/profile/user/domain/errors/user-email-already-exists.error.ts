import { AppError } from '../../../../core/errors/app.error';

export class UserEmailAlreadyExists extends AppError {
    constructor() {
        super('Cette adresse e-mail est déjà utilisée.', 'USER_002');
    }
}
