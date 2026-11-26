import type { EventSubscriber } from '../../../../core/bus/event-bus';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementEvents } from '../../domain/events/evenement.events';

export const registerEvenementDeletionWarningEmailListener = (events: EventSubscriber<EvenementEvents>): void => {
    events.subscribe(EVENEMENT_EVENTS.DELETION_WARNING, (event) => {
        const { creatorEmail, evenementId, deletionDate, daysUntilDeletion } = event;
        const delay = daysUntilDeletion === 1 ? '1 jour' : `${daysUntilDeletion} jours`;

        console.log(
            `[MAIL] À ${creatorEmail} | L’événement n°${evenementId} sera supprimé dans ${delay}, le ${deletionDate}, si sa date n’est pas reportée.`
        );
    });
};
