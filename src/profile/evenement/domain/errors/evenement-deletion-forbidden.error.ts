import { AppError } from '../../../../core/errors/app.error';

export class EvenementDeletionForbiddenError extends AppError {
    constructor() {
        super('Seul le créateur peut supprimer cet événement.', 'EVENEMENT_004');
    }
}
