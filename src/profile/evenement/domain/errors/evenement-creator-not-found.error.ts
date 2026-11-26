import { AppError } from '../../../../core/errors/app.error';

export class EvenementCreatorNotFoundError extends AppError {
    constructor() {
        super('Le compte du créateur est introuvable.', 'EVENEMENT_001');
    }
}
