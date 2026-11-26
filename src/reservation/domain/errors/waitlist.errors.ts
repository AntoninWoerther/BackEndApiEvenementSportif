import { AppError } from '../../../core/http/error.response';

export class WaitlistAlreadyJoinedError extends AppError {
    constructor() {
        super('Vous êtes déjà en file d’attente pour cet événement.', 409, 'WAITLIST_001');
    }
}

export class WaitlistPlaceAvailableError extends AppError {
    constructor() {
        super('Une place est disponible. Vous pouvez réserver directement.', 409, 'WAITLIST_002');
    }
}

export class WaitlistEntryNotFoundError extends AppError {
    constructor() {
        super('Entrée introuvable dans la file d’attente de cet événement.', 404, 'WAITLIST_003');
    }
}

export class InvalidWaitlistEntryIdError extends AppError {
    constructor() {
        super('Identifiant d’entrée de file d’attente invalide.', 400, 'WAITLIST_004');
    }
}
