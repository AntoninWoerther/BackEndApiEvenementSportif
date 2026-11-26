import type { Evenement, EvenementWithAvailability } from '../../domain/evenement';
import type { CreateEvenementInput } from '../inputs/create-evenement.input';

export type UpdateEvenementDateScope = 'own' | 'others' | 'any';

export type UpdateEvenementDateResult = 'updated' | 'unchanged' | 'evenement-not-found' | 'forbidden';

export interface EvenementGateway {
    listWithAvailability(): Promise<EvenementWithAvailability[]>;
    findWithAvailabilityById(evenementId: number): Promise<EvenementWithAvailability | null>;
    create(input: CreateEvenementInput, creatorId: number): Promise<Evenement | null>;
    deleteOwnedBy(evenementId: number, creatorId: number): Promise<boolean>;
    updateDate(
        evenementId: number,
        userId: number,
        date: string,
        scope: UpdateEvenementDateScope
    ): Promise<UpdateEvenementDateResult>;
    existsById(evenementId: number): Promise<boolean>;
}
