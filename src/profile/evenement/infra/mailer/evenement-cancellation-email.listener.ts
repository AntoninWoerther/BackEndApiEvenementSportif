import { eventEmitter } from '../../../../core/bus/event.emiter';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementCancelledEvent } from '../../domain/events/evenement.events';

export const registerEvenementCancellationEmailListener = (): void => {
    eventEmitter.on(EVENEMENT_EVENTS.CANCELLED, ({ evenementId, date, location, reason, participantEmails }: EvenementCancelledEvent) => {
        for (const email of participantEmails) {
            console.log(`[MAIL] À ${email} | L’événement n°${evenementId} du ${date} à ${location} est annulé. Motif : ${reason}`);
        }
    });
};
