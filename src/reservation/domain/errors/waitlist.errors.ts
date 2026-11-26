import { AppError } from '../../../core/errors/app.error';

export class WaitlistAlreadyJoinedError extends AppError {
    constructor() {
        super('Vous êtes déjà en file d’attente pour cet événement.', 'WAITLIST_001');
    }
}

export class WaitlistPlaceAvailableError extends AppError {
    constructor() {
        super('Une place est disponible. Vous pouvez réserver directement.', 'WAITLIST_002');
    }
}

export class WaitlistEntryNotFoundError extends AppError {
    constructor() {
        super('Entrée introuvable dans la file d’attente de cet événement.', 'WAITLIST_003');
    }
}

export class InvalidWaitlistEntryIdError extends AppError {
    constructor() {
        super('Identifiant d’entrée de file d’attente invalide.', 'WAITLIST_004');
    }
}
