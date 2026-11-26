import { AppError } from '../../../../core/errors/app.error';

export class InvalidUserIdError extends AppError {
    constructor() {
        super('Identifiant utilisateur invalide.', 'USER_003');
    }
}
