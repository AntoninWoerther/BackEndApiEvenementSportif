import type { EvenementWithAvailability } from '../../domain/evenement';
import { EvenementNotFoundError } from '../../domain/errors/evenement-not-found.error';
import type { EvenementGateway } from '../interfaces/evenement.gateway';

export type GetEvenementByIdUseCase = (evenementId: number) => Promise<EvenementWithAvailability>;

export const makeGetEvenementByIdUseCase = (
    gateway: Pick<EvenementGateway, 'findWithAvailabilityById'>
): GetEvenementByIdUseCase => {
    return async (evenementId) => {
        const evenement = await gateway.findWithAvailabilityById(evenementId);
        if (!evenement) {
            throw new EvenementNotFoundError();
        }

        return evenement;
    };
};
