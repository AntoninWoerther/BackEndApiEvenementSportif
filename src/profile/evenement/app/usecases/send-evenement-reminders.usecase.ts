import { eventEmitter } from '../../../../core/bus/event.emiter';
import { formatParisDay, shiftDay } from '../../../../core/date/paris-day';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementReminderGateway } from '../interfaces/evenement-reminder.gateway';

export const makeSendEvenementRemindersUseCase = (gateway: EvenementReminderGateway) => {
    return async (now = new Date()): Promise<void> => {
        const tomorrow = shiftDay(formatParisDay(now), 1);

        for (const id of await gateway.findDueEventIds(tomorrow)) {
            const reminder = await gateway.prepareReminder(id, tomorrow);
            if (reminder) {
                eventEmitter.emit(EVENEMENT_EVENTS.REMINDER_DUE, reminder);
            }
        }
    };
};
