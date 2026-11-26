import { AppError } from '../../../../core/errors/app.error';

export class EvenementDetailsUpdateForbiddenError extends AppError {
    constructor() {
        super('Vous n’avez pas le droit de modifier cet événement.', 'EVENEMENT_006');
    }
}
