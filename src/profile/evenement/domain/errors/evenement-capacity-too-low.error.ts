import { AppError } from '../../../../core/http/error.response';

export class EvenementCapacityTooLowError extends AppError {
    constructor() {
        super('La capacité ne peut pas être inférieure au nombre de personnes déjà inscrites.', 409, 'EVENEMENT_007');
    }
}
