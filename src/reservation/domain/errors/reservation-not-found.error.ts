import { AppError } from '../../../core/errors/app.error';

export class ReservationNotFoundError extends AppError {
    constructor() {
        super('Vous n’êtes pas inscrit à cet événement.', 'RESERVATION_003');
    }
}
