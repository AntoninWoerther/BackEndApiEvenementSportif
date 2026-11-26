export const WAITLIST_PROMOTED = 'reservation.waitlist.promoted';

export interface WaitlistPromotedEvent {
    evenementId: number;
    description: string;
    date: string;
    participantEmails: string[];
}
