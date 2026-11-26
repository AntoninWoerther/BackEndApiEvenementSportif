import type { EventPublisher } from '../../core/bus/event-bus';
import { WAITLIST_PROMOTED } from '../domain/events/waitlist-promoted.event';
import type { WaitlistEvents, WaitlistPromotedEvent } from '../domain/events/waitlist-promoted.event';

export const publishWaitlistPromotion = (
    events: EventPublisher<WaitlistEvents>,
    promotion: WaitlistPromotedEvent | null
): void => {
    if (promotion) {
        events.publish(WAITLIST_PROMOTED, promotion);
    }
};
