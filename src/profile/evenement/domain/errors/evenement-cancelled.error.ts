import { AppError } from '../../../../core/errors/app.error';

export class EvenementCancelledError extends AppError {
    constructor() {
        super('Cet événement est annulé.', 'EVENEMENT_009');
    }
}
