import { AppError } from '../../../../core/http/error.response';

export class EvenementDetailsUpdateForbiddenError extends AppError {
    constructor() {
        super('Vous n’avez pas le droit de modifier cet événement.', 403, 'EVENEMENT_006');
    }
}
