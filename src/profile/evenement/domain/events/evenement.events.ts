export const EVENEMENT_EVENTS = {
    DATE_UPDATED: 'evenement.date.updated',
    DELETION_WARNING: 'evenement.deletion.warning',
    CANCELLED: 'evenement.cancelled',
    REMINDER_DUE: 'evenement.reminder.due'
} as const;

export interface EvenementReminderEvent {
    evenementId: number;
    date: string;
    location: string;
    description: string;
    organizerName: string | null;
    participantEmails: string[];
}

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

export interface EvenementEvents {
    [EVENEMENT_EVENTS.DATE_UPDATED]: EvenementDateUpdatedEvent;
    [EVENEMENT_EVENTS.DELETION_WARNING]: EvenementDeletionWarningEvent;
    [EVENEMENT_EVENTS.CANCELLED]: EvenementCancelledEvent;
    [EVENEMENT_EVENTS.REMINDER_DUE]: EvenementReminderEvent;
}
