import { formatParisDay } from '../../../core/date/paris-day';
import type { Evenement } from './evenement';

export type RegistrationClosureReason = 'evenement-cancelled' | 'evenement-past';

export const getRegistrationClosureReason = (
    event: Pick<Evenement, 'cancelledAt' | 'date'>,
    now: Date
): RegistrationClosureReason | null => {
    if (event.cancelledAt) {
        return 'evenement-cancelled';
    }
    if (event.date < formatParisDay(now)) {
        return 'evenement-past';
    }
    return null;
};

export const getRemainingPlaces = (capacity: number, occupiedPlaces: number): number => {
    return Math.max(0, capacity - occupiedPlaces);
};
