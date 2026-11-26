import { AppError } from '../../../../core/errors/app.error';

export class EvenementUpdateForbiddenError extends AppError {
    constructor() {
        super('Vous n’avez pas le droit de modifier cet événement.', 'EVENEMENT_006');
    }
}
