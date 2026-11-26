import { InsufficientPermissionsError } from '../../../../auth/domain/errors/insufficient-permissions.error';
import { eventEmitter } from '../../../../core/bus/event.emiter';
import { hasUserPermission, USER_PERMISSIONS } from '../../../user/domain/permissions/user.permissions';
import { EvenementDateUpdateForbiddenError } from '../../domain/errors/evenement-date-update-forbidden.error';
import { EvenementNotFoundError } from '../../domain/errors/evenement-not-found.error';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementDateUpdatedEvent } from '../../domain/events/evenement.events';
import type { EvenementGateway } from '../interfaces/evenement.gateway';

export type UpdateEvenementDateUseCase = (
    evenementId: number,
    userId: number,
    date: string,
    permissions: number
) => Promise<void>;

export const makeUpdateEvenementDateUseCase = (gateway: EvenementGateway): UpdateEvenementDateUseCase => {
    return async (evenementId, userId, date, permissions) => {
        const canUpdateOwn = hasUserPermission(permissions, USER_PERMISSIONS.UPDATE_EVENT);
        const canUpdateOthers = hasUserPermission(permissions, USER_PERMISSIONS.UPDATE_OTHER_EVENTS);
        if (!canUpdateOwn && !canUpdateOthers) {
            throw new InsufficientPermissionsError();
        }

        const scope = canUpdateOwn && canUpdateOthers ? 'any' : canUpdateOwn ? 'own' : 'others';
        const result = await gateway.updateDate(evenementId, userId, date, scope);

        switch (result) {
            case 'updated':
                eventEmitter.emit(EVENEMENT_EVENTS.DATE_UPDATED, { evenementId, date } satisfies EvenementDateUpdatedEvent);
                return;
            case 'unchanged':
                return;
            case 'evenement-not-found':
                throw new EvenementNotFoundError();
            case 'forbidden':
                throw new EvenementDateUpdateForbiddenError();
        }
    };
};
