import { AppError } from '../../../../core/http/error.response';

export class UserEmailAlreadyExists extends AppError {
    constructor() {
        super('Cette adresse e-mail est déjà utilisée.', 409, 'USER_002');
    }
}
