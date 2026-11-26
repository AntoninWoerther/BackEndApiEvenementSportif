import { AppError } from '../../../../core/http/error.response';

export class EvenementDeletionForbiddenError extends AppError {
    constructor() {
        super('Seul le créateur peut supprimer cet événement.', 403, 'EVENEMENT_004');
    }
}
