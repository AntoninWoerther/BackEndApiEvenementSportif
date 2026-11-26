import type { Evenement, EvenementWithAvailability } from '../../domain/evenement';
import type { CreateEvenementInput } from '../inputs/create-evenement.input';
import type { UpdateEvenementDetailsInput } from '../inputs/update-evenement-details.input';

export type UpdateEvenementScope = 'own' | 'others' | 'any';

export type UpdateEvenementDateResult = 'updated' | 'unchanged' | 'evenement-not-found' | 'forbidden';

export type UpdateEvenementDetailsResult =
    | { status: 'updated'; evenement: Evenement }
    | { status: 'evenement-not-found' }
    | { status: 'forbidden' }
    | { status: 'capacity-too-low' };

export interface EvenementGateway {
    listWithAvailability(): Promise<EvenementWithAvailability[]>;
    findWithAvailabilityById(evenementId: number): Promise<EvenementWithAvailability | null>;
    create(input: CreateEvenementInput, creatorId: number): Promise<Evenement | null>;
    deleteOwnedBy(evenementId: number, creatorId: number): Promise<boolean>;
    updateDate(
        evenementId: number,
        userId: number,
        date: string,
        scope: UpdateEvenementScope
    ): Promise<UpdateEvenementDateResult>;
    updateDetails(
        evenementId: number,
        userId: number,
        input: UpdateEvenementDetailsInput,
        scope: UpdateEvenementScope
    ): Promise<UpdateEvenementDetailsResult>;
    existsById(evenementId: number): Promise<boolean>;
}
