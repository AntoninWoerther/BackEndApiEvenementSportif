import { AppError } from '../../../core/http/error.response';

export class ReservationAlreadyExistsError extends AppError {
    constructor() {
        super('Vous êtes déjà inscrit à cet événement.', 409, 'RESERVATION_001');
    }
}
