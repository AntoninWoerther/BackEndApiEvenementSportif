import { AppError } from '../../../../core/errors/app.error';

export class EvenementCapacityTooLowError extends AppError {
    constructor() {
        super('La capacité ne peut pas être inférieure au nombre de personnes déjà inscrites.', 'EVENEMENT_007');
    }
}
