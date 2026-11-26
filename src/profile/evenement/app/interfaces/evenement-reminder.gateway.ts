import type { EvenementReminderEvent } from '../../domain/events/evenement.events';

export interface EvenementReminderGateway {
    findDueEventIds(date: string): Promise<number[]>;
    prepareReminder(evenementId: number, date: string): Promise<EvenementReminderEvent | null>;
}
