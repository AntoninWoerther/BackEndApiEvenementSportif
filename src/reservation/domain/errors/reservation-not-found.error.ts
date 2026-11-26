import { AppError } from '../../../core/http/error.response';

export class ReservationNotFoundError extends AppError {
    constructor() {
        super('Vous n’êtes pas inscrit à cet événement.', 404, 'RESERVATION_003');
    }
}
