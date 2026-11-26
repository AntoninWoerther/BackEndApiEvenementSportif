import type { EventSubscriber } from '../../../../core/bus/event-bus';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementEvents } from '../../domain/events/evenement.events';

export const registerEvenementReminderEmailListener = (events: EventSubscriber<EvenementEvents>): void => {
    events.subscribe(EVENEMENT_EVENTS.REMINDER_DUE, (reminder) => {
        const { evenementId, date, location, description, organizerName, participantEmails } = reminder;
        for (const email of participantEmails) {
            console.log(`[MAIL] À ${email} | Rappel de l’événement n°${evenementId}. Date : ${date}. Lieu : ${location}. Description : ${description}. Organisateur : ${organizerName ?? 'indisponible'}.`);
        }
    });
};
