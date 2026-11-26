import { AppError } from '../../../../core/errors/app.error';

export class AccountSuspendedError extends AppError {
    constructor() {
        super('Ce compte est suspendu.', 'USER_007');
    }
}
