import { eventEmitter } from '../../core/bus/event.emiter';
import { WAITLIST_PROMOTED } from '../domain/events/waitlist-promoted.event';
import type { WaitlistPromotedEvent } from '../domain/events/waitlist-promoted.event';

export const publishWaitlistPromotion = (promotion: WaitlistPromotedEvent | null): void => {
    if (promotion) {
        eventEmitter.emit(WAITLIST_PROMOTED, promotion);
    }
};
