import type { EventSubscriber } from '../../../../core/bus/event-bus';
import { USER_EVENTS } from '../../domain/events/user.events';
import type { UserEvents } from '../../domain/events/user.events';

export const registerUserDeletionEmailListener = (events: EventSubscriber<UserEvents>): void => {
    events.subscribe(USER_EVENTS.USER_DELETED, email => {
        console.log(`[MAIL] À ${email} | Votre compte a été supprimé.`);
    });
};
