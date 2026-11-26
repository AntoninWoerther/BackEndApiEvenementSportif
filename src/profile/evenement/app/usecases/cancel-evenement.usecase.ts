import { eventEmitter } from '../../../../core/bus/event.emiter';
import { hasUserPermission, USER_PERMISSIONS } from '../../../user/domain/permissions/user.permissions';
import type { Evenement } from '../../domain/evenement';
import { EvenementCancellationForbiddenError } from '../../domain/errors/evenement-cancellation-forbidden.error';
import { EvenementCancelledError } from '../../domain/errors/evenement-cancelled.error';
import { EvenementNotFoundError } from '../../domain/errors/evenement-not-found.error';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementCancelledEvent } from '../../domain/events/evenement.events';
import type { EvenementGateway } from '../interfaces/evenement.gateway';

export type CancelEvenementUseCase = (
    evenementId: number,
    userId: number,
    reason: string,
    permissions: number
) => Promise<Evenement>;

export const makeCancelEvenementUseCase = (gateway: Pick<EvenementGateway, 'cancel'>): CancelEvenementUseCase => {
    return async (evenementId, userId, reason, permissions) => {
        const canCancelOther = hasUserPermission(permissions, USER_PERMISSIONS.CANCEL_OTHER_EVENTS);
        const result = await gateway.cancel(evenementId, userId, reason, canCancelOther);

        switch (result.status) {
            case 'cancelled': {
                const { evenement, participantEmails } = result;
                eventEmitter.emit(EVENEMENT_EVENTS.CANCELLED, {
                    evenementId, date: evenement.date, location: evenement.location, reason, participantEmails
                } satisfies EvenementCancelledEvent);
                return evenement;
            }
            case 'evenement-not-found':
                throw new EvenementNotFoundError();
            case 'forbidden':
                throw new EvenementCancellationForbiddenError();
            case 'already-cancelled':
                throw new EvenementCancelledError();
        }
    };
};
