import { AppError } from '../../../core/http/error.response';

export class ReservationParticipantNotFoundError extends AppError {
    constructor() {
        super('Ce participant n’est pas inscrit à cet événement.', 404, 'RESERVATION_004');
    }
}
