import { EvenementCapacityTooLowError } from '../../domain/errors/evenement-capacity-too-low.error';
import { EvenementDetailsUpdateForbiddenError } from '../../domain/errors/evenement-details-update-forbidden.error';
import { EvenementNotFoundError } from '../../domain/errors/evenement-not-found.error';
import type { Evenement } from '../../domain/evenement';
import type { UpdateEvenementDetailsInput } from '../inputs/update-evenement-details.input';
import type { EvenementGateway } from '../interfaces/evenement.gateway';
import { resolveEvenementUpdateScope } from '../resolve-evenement-update-scope';

export type UpdateEvenementDetailsUseCase = (
    evenementId: number,
    userId: number,
    input: UpdateEvenementDetailsInput,
    permissions: number
) => Promise<Evenement>;

export const makeUpdateEvenementDetailsUseCase = (
    gateway: Pick<EvenementGateway, 'updateDetails'>
): UpdateEvenementDetailsUseCase => {
    return async (evenementId, userId, input, permissions) => {
        const scope = resolveEvenementUpdateScope(permissions);
        const result = await gateway.updateDetails(evenementId, userId, input, scope);

        switch (result.status) {
            case 'updated':
                return result.evenement;
            case 'evenement-not-found':
                throw new EvenementNotFoundError();
            case 'forbidden':
                throw new EvenementDetailsUpdateForbiddenError();
            case 'capacity-too-low':
                throw new EvenementCapacityTooLowError();
        }
    };
};
