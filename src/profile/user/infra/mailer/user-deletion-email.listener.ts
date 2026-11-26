import { eventEmitter } from '../../../../core/bus/event.emiter';
import { USER_EVENTS } from '../../domain/events/user.events';

export const registerUserDeletionEmailListener = (): void => {
    eventEmitter.on(USER_EVENTS.USER_DELETED, (email: string) => {
        console.log(`[MAIL] À ${email} | Votre compte a été supprimé.`);
    });
};
