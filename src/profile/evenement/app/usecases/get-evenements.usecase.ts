import type { EvenementWithAvailability } from '../../domain/evenement';
import type { EvenementGateway } from '../interfaces/evenement.gateway';

export type GetEvenementsUseCase = () => Promise<EvenementWithAvailability[]>;

export const makeGetEvenementsUseCase = (
    gateway: Pick<EvenementGateway, 'listWithAvailability'>
): GetEvenementsUseCase => {
    return () => gateway.listWithAvailability();
};
