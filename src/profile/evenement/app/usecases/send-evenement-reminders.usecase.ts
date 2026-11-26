import type { EventPublisher } from '../../../../core/bus/event-bus';
import { formatParisDay, shiftDay } from '../../../../core/date/paris-day';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementEvents } from '../../domain/events/evenement.events';
import type { EvenementReminderGateway } from '../interfaces/evenement-reminder.gateway';

export const makeSendEvenementRemindersUseCase = (
    gateway: EvenementReminderGateway,
    events: EventPublisher<EvenementEvents>
) => {
    return async (now = new Date()): Promise<void> => {
        const tomorrow = shiftDay(formatParisDay(now), 1);

        for (const id of await gateway.findDueEventIds(tomorrow)) {
            const reminder = await gateway.prepareReminder(id, tomorrow);
            if (reminder) {
                events.publish(EVENEMENT_EVENTS.REMINDER_DUE, reminder);
            }
        }
    };
};
