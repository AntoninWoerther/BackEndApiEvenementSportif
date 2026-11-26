import { eventEmitter } from '../../../../core/bus/event.emiter';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementDeletionWarningEvent } from '../../domain/events/evenement.events';

export const registerEvenementDeletionWarningEmailListener = (): void => {
    eventEmitter.on(EVENEMENT_EVENTS.DELETION_WARNING, (event: EvenementDeletionWarningEvent) => {
        const { creatorEmail, evenementId, deletionDate, daysUntilDeletion } = event;
        const delay = daysUntilDeletion === 1 ? '1 jour' : `${daysUntilDeletion} jours`;

        console.log(
            `[MAIL] À ${creatorEmail} | L’événement n°${evenementId} sera supprimé dans ${delay}, le ${deletionDate}, si sa date n’est pas reportée.`
        );
    });
};
