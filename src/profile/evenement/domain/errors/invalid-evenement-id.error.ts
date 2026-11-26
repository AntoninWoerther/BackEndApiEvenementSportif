import { AppError } from '../../../../core/errors/app.error';

export class InvalidEvenementIdError extends AppError {
    constructor() {
        super('Identifiant d’événement invalide.', 'EVENEMENT_002');
    }
}
