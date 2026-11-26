import { EvenementDeletionForbiddenError } from '../../domain/errors/evenement-deletion-forbidden.error';
import { EvenementNotFoundError } from '../../domain/errors/evenement-not-found.error';
import type { EvenementGateway } from '../interfaces/evenement.gateway';

export type DeleteEvenementUseCase = (evenementId: number, userId: number) => Promise<void>;

export const makeDeleteEvenementUseCase = (gateway: EvenementGateway): DeleteEvenementUseCase => {
    return async (evenementId, userId) => {
        if (await gateway.deleteOwnedBy(evenementId, userId)) {
            return;
        }

        if (!(await gateway.existsById(evenementId))) {
            throw new EvenementNotFoundError();
        }

        throw new EvenementDeletionForbiddenError();
    };
};
