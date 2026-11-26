import { AppError } from '../../../../core/http/error.response';

export class EvenementDateUpdateForbiddenError extends AppError {
    constructor() {
        super('Vous n’avez pas le droit de modifier la date de cet événement.', 403, 'EVENEMENT_005');
    }
}
