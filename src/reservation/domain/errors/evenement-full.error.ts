import { AppError } from '../../../core/http/error.response';

export class EvenementFullError extends AppError {
    constructor() {
        super('Cet événement est complet.', 409, 'RESERVATION_002');
    }
}
