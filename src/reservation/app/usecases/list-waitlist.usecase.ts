import { InsufficientPermissionsError } from '../../../auth/domain/errors/insufficient-permissions.error';
import { EvenementNotFoundError } from '../../../profile/evenement/domain/errors/evenement-not-found.error';
import { hasUserPermission, USER_PERMISSIONS } from '../../../profile/user/domain/permissions/user.permissions';
import type { WaitlistParticipant } from '../../domain/waitlist-entry';
import type { WaitlistGateway } from '../interfaces/waitlist.gateway';

export type ListWaitlistUseCase = (evenementId: number, actorId: number, permissions: number) => Promise<WaitlistParticipant[]>;

export const makeListWaitlistUseCase = (gateway: Pick<WaitlistGateway, 'list'>): ListWaitlistUseCase => {
    return async (evenementId, actorId, permissions) => {
        const canManageOthers = hasUserPermission(permissions, USER_PERMISSIONS.MANAGE_OTHER_EVENT_WAITLISTS);
        const result = await gateway.list(evenementId, actorId, canManageOthers);
        switch (result.status) {
            case 'listed': return result.entries;
            case 'evenement-not-found': throw new EvenementNotFoundError();
            case 'forbidden': throw new InsufficientPermissionsError();
        }
    };
};
