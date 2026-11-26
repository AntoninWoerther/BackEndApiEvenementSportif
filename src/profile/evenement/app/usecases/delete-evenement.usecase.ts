import { EvenementCancelledError } from '../../domain/errors/evenement-cancelled.error';
import { EvenementDeletionForbiddenError } from '../../domain/errors/evenement-deletion-forbidden.error';
import { EvenementNotFoundError } from '../../domain/errors/evenement-not-found.error';
import type { EvenementGateway } from '../interfaces/evenement.gateway';

export type DeleteEvenementUseCase = (evenementId: number, userId: number) => Promise<void>;

export const makeDeleteEvenementUseCase = (gateway: EvenementGateway): DeleteEvenementUseCase => {
    return async (evenementId, userId) => {
        switch (await gateway.deleteOwnedBy(evenementId, userId)) {
            case 'deleted':
                return;
            case 'evenement-not-found':
                throw new EvenementNotFoundError();
            case 'forbidden':
                throw new EvenementDeletionForbiddenError();
            case 'already-cancelled':
                throw new EvenementCancelledError();
        }
    };
};
