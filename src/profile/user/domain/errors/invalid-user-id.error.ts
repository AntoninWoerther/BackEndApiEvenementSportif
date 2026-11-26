import { AppError } from '../../../../core/http/error.response';

export class InvalidUserIdError extends AppError {
    constructor() {
        super('Identifiant utilisateur invalide.', 400, 'USER_003');
    }
}
