import { eventEmitter } from '../../../../core/bus/event.emiter';
import { formatParisDay, shiftDay } from '../../../../core/date/paris-day';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementDeletionWarningEvent } from '../../domain/events/evenement.events';
import type { EvenementCleanupGateway } from '../interfaces/evenement-cleanup.gateway';

const WARNING_AFTER_DAYS = 5;
const DELETE_AFTER_DAYS = 7;
const CANCELLED_RETENTION_MS = 5 * 24 * 60 * 60 * 1000;

export type CleanupEvenementsUseCase = (now?: Date) => Promise<number>;

export const makeCleanupEvenementsUseCase = (gateway: EvenementCleanupGateway): CleanupEvenementsUseCase => {
    return async (now = new Date()) => {
        const today = formatParisDay(now);
        const lastExpiredCancellation = new Date(now.getTime() - CANCELLED_RETENTION_MS);
        const deleted = await gateway.deleteExpired(shiftDay(today, -DELETE_AFTER_DAYS), lastExpiredCancellation);
        const lastWarningDate = shiftDay(today, -WARNING_AFTER_DAYS);
        const toWarn = await gateway.findToWarn(shiftDay(today, 1 - DELETE_AFTER_DAYS), lastWarningDate);

        for (const evenement of toWarn) {
            if (await gateway.markWarningSent(evenement, now)) {
                const event: EvenementDeletionWarningEvent = {
                    evenementId: evenement.id,
                    creatorEmail: evenement.creatorEmail,
                    deletionDate: shiftDay(evenement.date, DELETE_AFTER_DAYS),
                    daysUntilDeletion: evenement.date === lastWarningDate ? 2 : 1
                };

                eventEmitter.emit(EVENEMENT_EVENTS.DELETION_WARNING, event);
            }
        }

        return deleted;
    };
};
