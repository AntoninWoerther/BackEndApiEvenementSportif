import { AppError } from '../../../core/errors/app.error';

export class ReservationAlreadyExistsError extends AppError {
    constructor() {
        super('Vous êtes déjà inscrit à cet événement.', 'RESERVATION_001');
    }
}
