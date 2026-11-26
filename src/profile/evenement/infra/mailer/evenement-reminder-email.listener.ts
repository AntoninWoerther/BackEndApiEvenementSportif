import { eventEmitter } from '../../../../core/bus/event.emiter';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementReminderEvent } from '../../domain/events/evenement.events';

export const registerEvenementReminderEmailListener = (): void => {
    eventEmitter.on(EVENEMENT_EVENTS.REMINDER_DUE, (reminder: EvenementReminderEvent) => {
        const { evenementId, date, location, description, organizerName, participantEmails } = reminder;
        for (const email of participantEmails) {
            console.log(`[MAIL] À ${email} | Rappel de l’événement n°${evenementId}. Date : ${date}. Lieu : ${location}. Description : ${description}. Organisateur : ${organizerName ?? 'indisponible'}.`);
        }
    });
};
