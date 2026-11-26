import { InsufficientPermissionsError } from '../../../../auth/domain/errors/insufficient-permissions.error';
import { InvalidTokenError } from '../../../../auth/domain/errors/invalid-token.error';
import { InvalidUserPermissionsError } from '../../domain/errors/invalid-user-permissions.error';
import { UserNotFound } from '../../domain/errors/user-not-found.error';
import { isGrantableUserPermission } from '../../domain/permissions/user.permissions';
import type { UserPermissionAction, UserPermissionsGateway } from '../interfaces/user-permissions.gateway';

export type ChangeUserPermissionUseCase = (actorId: number, userId: number, permission: number) => Promise<number>;

export const makeChangeUserPermissionUseCase = (
    gateway: UserPermissionsGateway,
    action: UserPermissionAction
): ChangeUserPermissionUseCase => {
    return async (actorId, userId, permission) => {
        if (actorId === userId) {
            throw new InsufficientPermissionsError('Vous ne pouvez pas modifier vos propres permissions.');
        }

        if (!isGrantableUserPermission(permission)) {
            throw new InvalidUserPermissionsError();
        }

        const result = await gateway.changePermission(actorId, userId, permission, action);

        switch (result.status) {
            case 'applied':
                return result.permissions;
            case 'forbidden':
                throw new InsufficientPermissionsError();
            case 'actor-not-found':
                throw new InvalidTokenError();
            case 'user-not-found':
                throw new UserNotFound();
        }
    };
};
