import type { EventSubscriber } from '../../../../core/bus/event-bus';
import type { UserGateway } from '../../app/interfaces/user.gateway';
import { USER_EVENTS } from '../../domain/events/user.events';
import type { UserEvents } from '../../domain/events/user.events';

export const registerSignupEmailListeners = (
    events: EventSubscriber<UserEvents>,
    users: Pick<UserGateway, 'findByEmail'>
): void => {
    events.subscribe(USER_EVENTS.USER_CREATED, email => {
        console.log(`[MAIL] Envoi du mail de validation à ${email}`);
    });

    events.subscribe(USER_EVENTS.USER_SIGNUP_DUPLICATE, async email => {
        try {
            const user = await users.findByEmail(email);
            if (user) {
                console.log(
                    `[MAIL] À ${user.email} | Aucun nouveau compte n’a été créé. Cette adresse est déjà associée à un compte.`
                );
            }
        } catch {
            console.error('[MAIL] Impossible de simuler la notification d’inscription.');
        }
    });
};