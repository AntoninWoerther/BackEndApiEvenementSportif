import type { EventPublisher } from '../../../../core/bus/event-bus';
import { EvenementUpdateForbiddenError } from '../../domain/errors/evenement-update-forbidden.error';
import { EvenementCancelledError } from '../../domain/errors/evenement-cancelled.error';
import { EvenementNotFoundError } from '../../domain/errors/evenement-not-found.error';
import { EVENEMENT_EVENTS } from '../../domain/events/evenement.events';
import type { EvenementEvents } from '../../domain/events/evenement.events';
import type { EvenementGateway } from '../interfaces/evenement.gateway';
import { resolveEvenementUpdateScope } from '../resolve-evenement-update-scope';

export type UpdateEvenementDateUseCase = (
    evenementId: number,
    userId: number,
    date: string,
    permissions: number
) => Promise<void>;

export const makeUpdateEvenementDateUseCase = (
    gateway: EvenementGateway,
    events: EventPublisher<EvenementEvents>
): UpdateEvenementDateUseCase => {
    return async (evenementId, userId, date, permissions) => {
        const scope = resolveEvenementUpdateScope(permissions);
        const result = await gateway.updateDate(evenementId, userId, date, scope);

        switch (result) {
            case 'updated':
                events.publish(EVENEMENT_EVENTS.DATE_UPDATED, { evenementId, date });
                return;
            case 'unchanged':
                return;
            case 'evenement-not-found':
                throw new EvenementNotFoundError();
            case 'forbidden':
                throw new EvenementUpdateForbiddenError();
            case 'already-cancelled':
                throw new EvenementCancelledError();
        }
    };
};
