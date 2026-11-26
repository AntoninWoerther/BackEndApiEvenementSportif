import { eventEmitter } from '../../../core/bus/event.emiter';
import { WAITLIST_PROMOTED } from '../../domain/events/waitlist-promoted.event';
import type { WaitlistPromotedEvent } from '../../domain/events/waitlist-promoted.event';

export const registerWaitlistPromotionEmailListener = (): void => {
    eventEmitter.on(WAITLIST_PROMOTED, ({ description, date, participantEmails }: WaitlistPromotedEvent) => {
        for (const email of participantEmails) {
            console.log(`[MAIL] À ${email} | Une place s’est libérée. Vous avez été inscrit à l’événement ${description} du ${date}.`);
        }
    });
};
