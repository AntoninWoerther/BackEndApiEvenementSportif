import type { Evenement } from '../../domain/evenement';
import { EvenementCreatorNotFoundError } from '../../domain/errors/evenement-creator-not-found.error';
import type { CreateEvenementInput } from '../inputs/create-evenement.input';
import type { EvenementGateway } from '../interfaces/evenement.gateway';

export type CreateEvenementUseCase = (input: CreateEvenementInput, creatorId: number) => Promise<Evenement>;

export const makeCreateEvenementUseCase = (gateway: EvenementGateway): CreateEvenementUseCase => {
    return async (input, creatorId) => {
        const evenement = await gateway.create(input, creatorId);

        if (!evenement) {
            throw new EvenementCreatorNotFoundError();
        }

        return evenement;
    };
};
