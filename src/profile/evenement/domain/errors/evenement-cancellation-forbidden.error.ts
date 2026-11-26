import { AppError } from '../../../../core/http/error.response';

export class EvenementCancellationForbiddenError extends AppError {
    constructor() {
        super('Vous n’avez pas le droit d’annuler cet événement.', 403, 'EVENEMENT_008');
    }
}
