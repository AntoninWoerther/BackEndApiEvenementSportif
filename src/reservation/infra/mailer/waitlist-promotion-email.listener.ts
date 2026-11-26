import type { EventSubscriber } from '../../../core/bus/event-bus';
import { WAITLIST_PROMOTED } from '../../domain/events/waitlist-promoted.event';
import type { WaitlistEvents } from '../../domain/events/waitlist-promoted.event';

export const registerWaitlistPromotionEmailListener = (events: EventSubscriber<WaitlistEvents>): void => {
    events.subscribe(WAITLIST_PROMOTED, ({ description, date, participantEmails }) => {
        for (const email of participantEmails) {
            console.log(`[MAIL] À ${email} | Une place s’est libérée. Vous avez été inscrit à l’événement ${description} du ${date}.`);
        }
    });
};
