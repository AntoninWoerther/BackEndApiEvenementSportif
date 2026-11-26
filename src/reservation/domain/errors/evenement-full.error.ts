import { AppError } from '../../../core/errors/app.error';

export class EvenementFullError extends AppError {
    constructor() {
        super('Cet événement est complet.', 'RESERVATION_002');
    }
}
