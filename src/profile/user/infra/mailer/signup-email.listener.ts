import { eventEmitter } from '../../../../core/bus/event.emiter';
import type { UserGateway } from '../../app/interfaces/user.gateway';
import { USER_EVENTS } from '../../domain/events/user.events';

export const registerSignupEmailListeners = (users: Pick<UserGateway, 'findByEmail'>): void => {
    eventEmitter.on(USER_EVENTS.USER_CREATED, (email: string) => {
        console.log(`[MAIL] Envoi du mail de validation à ${email}`);
    });

    eventEmitter.on(USER_EVENTS.USER_SIGNUP_DUPLICATE, async (email: string) => {
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