import { AppError } from '../../../../core/errors/app.error';

export class EvenementDateUpdateForbiddenError extends AppError {
    constructor() {
        super('Vous n’avez pas le droit de modifier la date de cet événement.', 'EVENEMENT_005');
    }
}
