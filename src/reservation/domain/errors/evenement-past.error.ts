import { AppError } from '../../../core/http/error.response';

export class EvenementPastError extends AppError {
    constructor() {
        super('La date de cet événement est passée. Les inscriptions sont closes.', 409, 'RESERVATION_005');
    }
}
