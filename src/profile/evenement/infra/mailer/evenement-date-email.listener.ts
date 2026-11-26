import { eventEmitter } from '../../../../core/bus/event.emiter';
import type { ReservationGateway } from '../../../../reservation/app/interfaces/reservation.gateway';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementDateUpdatedEvent } from '../../domain/events/evenement.events';

export const registerEvenementDateEmailListener = (
    reservations: Pick<ReservationGateway, 'findParticipantEmails'>
): void => {
    eventEmitter.on(EVENEMENT_EVENTS.DATE_UPDATED, async ({ evenementId, date }: EvenementDateUpdatedEvent) => {
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
