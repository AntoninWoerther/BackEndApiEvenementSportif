import { AppError } from '../../../../core/http/error.response';

export class InvalidEvenementIdError extends AppError {
    constructor() {
        super('Identifiant d’événement invalide.', 400, 'EVENEMENT_002');
    }
}
