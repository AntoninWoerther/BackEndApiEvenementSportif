import { InsufficientPermissionsError } from '../../../auth/domain/errors/insufficient-permissions.error';
import { EvenementCancelledError } from '../../../profile/evenement/domain/errors/evenement-cancelled.error';
import { EvenementNotFoundError } from '../../../profile/evenement/domain/errors/evenement-not-found.error';
import { hasUserPermission, USER_PERMISSIONS } from '../../../profile/user/domain/permissions/user.permissions';
import { EvenementPastError } from '../../domain/errors/evenement-past.error';
import { WaitlistEntryNotFoundError } from '../../domain/errors/waitlist.errors';
import type { WaitlistEntry } from '../../domain/waitlist-entry';
import type { WaitlistGateway } from '../interfaces/waitlist.gateway';

export type MoveWaitlistEntryUpUseCase = (
    evenementId: number, entryId: number, actorId: number, permissions: number
) => Promise<WaitlistEntry>;

export const makeMoveWaitlistEntryUpUseCase = (gateway: Pick<WaitlistGateway, 'moveUp'>): MoveWaitlistEntryUpUseCase => {
    return async (evenementId, entryId, actorId, permissions) => {
        const canManageOthers = hasUserPermission(permissions, USER_PERMISSIONS.MANAGE_OTHER_EVENT_WAITLISTS);
        const result = await gateway.moveUp(evenementId, entryId, actorId, canManageOthers);
        switch (result.status) {
            case 'position': return result.entry;
            case 'evenement-not-found': throw new EvenementNotFoundError();
            case 'entry-not-found': throw new WaitlistEntryNotFoundError();
            case 'forbidden': throw new InsufficientPermissionsError();
            case 'evenement-cancelled': throw new EvenementCancelledError();
            case 'evenement-past': throw new EvenementPastError();
        }
    };
};
