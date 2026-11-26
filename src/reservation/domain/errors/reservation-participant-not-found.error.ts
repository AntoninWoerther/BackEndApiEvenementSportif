import { AppError } from '../../../core/errors/app.error';

export class ReservationParticipantNotFoundError extends AppError {
    constructor() {
        super('Ce participant n’est pas inscrit à cet événement.', 'RESERVATION_004');
    }
}
