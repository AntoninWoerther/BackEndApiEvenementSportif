import { AppError } from '../../../../core/http/error.response';

export class EvenementNotFoundError extends AppError {
    constructor() {
        super('Événement introuvable.', 404, 'EVENEMENT_003');
    }
}
