import { InsufficientPermissionsError } from '../../../auth/domain/errors/insufficient-permissions.error';
import { EvenementNotFoundError } from '../../../profile/evenement/domain/errors/evenement-not-found.error';
import { hasUserPermission, USER_PERMISSIONS } from '../../../profile/user/domain/permissions/user.permissions';
import type { EventParticipant } from '../../domain/event-participant';
import type { ReservationGateway } from '../interfaces/reservation.gateway';

export type GetEventParticipantsUseCase = (
    evenementId: number,
    actor: { id: number; permissions: number }
) => Promise<EventParticipant[]>;

export const makeGetEventParticipantsUseCase = (
    gateway: Pick<ReservationGateway, 'findEvenementOwner' | 'listEventParticipants'>
): GetEventParticipantsUseCase => {
    return async (evenementId, actor) => {
        const evenement = await gateway.findEvenementOwner(evenementId);
        if (!evenement) {
            throw new EvenementNotFoundError();
        }

        if (evenement.creatorId !== actor.id && !hasUserPermission(actor.permissions, USER_PERMISSIONS.VIEW_OTHER_EVENT_PARTICIPANTS)) {
            throw new InsufficientPermissionsError();
        }

        return gateway.listEventParticipants(evenementId);
    };
};
