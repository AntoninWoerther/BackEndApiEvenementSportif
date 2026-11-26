import { InsufficientPermissionsError } from '../../../../auth/domain/errors/insufficient-permissions.error';
import type { EventPublisher } from '../../../../core/bus/event-bus';
import { publishWaitlistPromotion } from '../../../../reservation/app/publish-waitlist-promotion';
import type { WaitlistEvents } from '../../../../reservation/domain/events/waitlist-promoted.event';
import { UserNotFound } from '../../domain/errors/user-not-found.error';
import { USER_EVENTS } from '../../domain/events/user.events';
import type { UserEvents } from '../../domain/events/user.events';
import { hasUserPermission, USER_PERMISSIONS } from '../../domain/permissions/user.permissions';
import type { UserGateway } from '../interfaces/user.gateway';

export type DeleteUserUseCase = (id: number, actor: { id: number; permissions: number }) => Promise<void>;

export const makeDeleteUserUseCase = (
    users: Pick<UserGateway, 'deleteById'>,
    events: EventPublisher<UserEvents & WaitlistEvents>
): DeleteUserUseCase => {
    return async (id, actor) => {
        if (actor.id !== id && !hasUserPermission(actor.permissions, USER_PERMISSIONS.DELETE_ACCOUNT)) {
            throw new InsufficientPermissionsError();
        }

        const deleted = await users.deleteById(id);
        if (!deleted) {
            throw new UserNotFound();
        }

        for (const promotion of deleted.promotions) {
            publishWaitlistPromotion(events, promotion);
        }
        events.publish(USER_EVENTS.USER_DELETED, deleted.email);
    };
};
