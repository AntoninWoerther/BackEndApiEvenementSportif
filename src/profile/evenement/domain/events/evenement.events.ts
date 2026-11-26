export const EVENEMENT_EVENTS = {
    DATE_UPDATED: 'evenement.date.updated',
    DELETION_WARNING: 'evenement.deletion.warning'
} as const;

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
