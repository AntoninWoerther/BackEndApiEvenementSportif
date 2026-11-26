import { AppError } from '../../../../core/http/error.response';

export class EvenementCancelledError extends AppError {
    constructor() {
        super('Cet événement est annulé.', 409, 'EVENEMENT_009');
    }
}
