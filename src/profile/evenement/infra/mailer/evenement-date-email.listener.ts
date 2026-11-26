import type { EventSubscriber } from '../../../../core/bus/event-bus';
import type { ReservationGateway } from '../../../../reservation/app/interfaces/reservation.gateway';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementEvents } from '../../domain/events/evenement.events';

export const registerEvenementDateEmailListener = (
    events: EventSubscriber<EvenementEvents>,
    reservations: Pick<ReservationGateway, 'findParticipantEmails'>
): void => {
    events.subscribe(EVENEMENT_EVENTS.DATE_UPDATED, async ({ evenementId, date }) => {
        try {
            const emails = await reservations.findParticipantEmails(evenementId);
            for (const email of emails) {
                console.log(`[MAIL] À ${email} | La date de l’événement n°${evenementId} a changé. Nouvelle date : ${date}.`);
            }
        } catch {
            console.error('[MAIL] Impossible de simuler les notifications de changement de date.');
        }
    });
};
