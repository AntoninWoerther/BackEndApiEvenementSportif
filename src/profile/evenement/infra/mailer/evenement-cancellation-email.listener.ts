import type { EventSubscriber } from '../../../../core/bus/event-bus';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementEvents } from '../../domain/events/evenement.events';

export const registerEvenementCancellationEmailListener = (events: EventSubscriber<EvenementEvents>): void => {
    events.subscribe(EVENEMENT_EVENTS.CANCELLED, ({ evenementId, date, location, reason, participantEmails }) => {
        for (const email of participantEmails) {
            console.log(`[MAIL] À ${email} | L’événement n°${evenementId} du ${date} à ${location} est annulé. Motif : ${reason}`);
        }
    });
};
