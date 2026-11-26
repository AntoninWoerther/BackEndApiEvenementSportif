import { AppError } from '../../../../core/http/error.response';

export class EvenementCreatorNotFoundError extends AppError {
    constructor() {
        super('Le compte du créateur est introuvable.', 404, 'EVENEMENT_001');
    }
}
