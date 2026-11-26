import { AppError } from '../../../../core/http/error.response';

export class AccountSuspendedError extends AppError {
    constructor() {
        super('Ce compte est suspendu.', 403, 'USER_007');
    }
}
