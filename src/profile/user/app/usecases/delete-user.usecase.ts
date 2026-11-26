import { InsufficientPermissionsError } from '../../../../auth/domain/errors/insufficient-permissions.error';
import { eventEmitter } from '../../../../core/bus/event.emiter';
import { UserNotFound } from '../../domain/errors/user-not-found.error';
import { hasUserPermission, USER_PERMISSIONS } from '../../domain/permissions/user.permissions';
import { USER_EVENTS } from '../../domain/events/user.events';
import { deleteUserById } from '../../infra/persistance/repositories/user.repository';

export const deleteUserUseCase = async (id: number, actor: { id: number; permissions: number }): Promise<void> => {
    if (actor.id !== id && !hasUserPermission(actor.permissions, USER_PERMISSIONS.DELETE_ACCOUNT)) {
        throw new InsufficientPermissionsError();
    }

    const email = await deleteUserById(id);

    if (email === null) {
        throw new UserNotFound();
    }

    eventEmitter.emit(USER_EVENTS.USER_DELETED, email);
};
