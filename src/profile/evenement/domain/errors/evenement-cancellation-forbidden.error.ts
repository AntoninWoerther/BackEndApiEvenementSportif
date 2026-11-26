import { AppError } from '../../../../core/errors/app.error';

export class EvenementCancellationForbiddenError extends AppError {
    constructor() {
        super('Vous n’avez pas le droit d’annuler cet événement.', 'EVENEMENT_008');
    }
}
