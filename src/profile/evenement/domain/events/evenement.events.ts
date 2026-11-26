export const EVENEMENT_EVENTS = {
    DATE_UPDATED: 'evenement.date.updated',
    DELETION_WARNING: 'evenement.deletion.warning',
    CANCELLED: 'evenement.cancelled'
} as const;

export interface EvenementCancelledEvent {
    evenementId: number;
    date: string;
    location: string;
    reason: string;
    participantEmails: string[];
}

export interface EvenementDateUpdatedEvent {
    evenementId: number;
    date: string;
}

export interface EvenementDeletionWarningEvent {
    evenementId: number;
    creatorEmail: string;
    deletionDate: string;
    daysUntilDeletion: number;
}
