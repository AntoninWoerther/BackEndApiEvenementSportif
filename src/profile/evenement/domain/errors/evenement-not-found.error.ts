import { AppError } from '../../../../core/errors/app.error';

export class EvenementNotFoundError extends AppError {
    constructor() {
        super('Événement introuvable.', 'EVENEMENT_003');
    }
}
