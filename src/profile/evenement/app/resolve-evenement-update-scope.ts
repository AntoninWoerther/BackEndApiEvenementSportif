import { InsufficientPermissionsError } from '../../../auth/domain/errors/insufficient-permissions.error';
import { hasUserPermission, USER_PERMISSIONS } from '../../user/domain/permissions/user.permissions';
import type { UpdateEvenementScope } from './interfaces/evenement.gateway';

export const resolveEvenementUpdateScope = (permissions: number): UpdateEvenementScope => {
    const canUpdateOwn = hasUserPermission(permissions, USER_PERMISSIONS.UPDATE_EVENT);
    const canUpdateOthers = hasUserPermission(permissions, USER_PERMISSIONS.UPDATE_OTHER_EVENTS);
    if (!canUpdateOwn && !canUpdateOthers) {
        throw new InsufficientPermissionsError();
    }

    return canUpdateOwn && canUpdateOthers ? 'any' : canUpdateOwn ? 'own' : 'others';
};
