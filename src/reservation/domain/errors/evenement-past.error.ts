import { AppError } from '../../../core/errors/app.error';

export class EvenementPastError extends AppError {
    constructor() {
        super('La date de cet événement est passée. Les inscriptions sont closes.', 'RESERVATION_005');
    }
}
