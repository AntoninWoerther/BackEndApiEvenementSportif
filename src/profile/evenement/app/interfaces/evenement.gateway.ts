import type { WaitlistPromotedEvent } from '../../../../reservation/domain/events/waitlist-promoted.event';
import type { Evenement, EvenementWithAvailability } from '../../domain/evenement';
import type { CreateEvenementInput } from '../inputs/create-evenement.input';
import type { UpdateEvenementDetailsInput } from '../inputs/update-evenement-details.input';

export type UpdateEvenementScope = 'own' | 'others' | 'any';

export type UpdateEvenementDateResult = 'updated' | 'unchanged' | 'evenement-not-found' | 'forbidden' | 'already-cancelled';

export type UpdateEvenementDetailsResult =
    | { status: 'updated'; evenement: Evenement; promotion: WaitlistPromotedEvent | null }
    | { status: 'evenement-not-found' }
    | { status: 'forbidden' }
    | { status: 'capacity-too-low' }
    | { status: 'already-cancelled' };

export type DeleteEvenementResult = 'deleted' | 'evenement-not-found' | 'forbidden' | 'already-cancelled';

export type CancelEvenementResult =
    | { status: 'cancelled'; evenement: Evenement; participantEmails: string[] }
    | { status: 'evenement-not-found' }
    | { status: 'forbidden' }
    | { status: 'already-cancelled' };

export interface EvenementGateway {
    listWithAvailability(): Promise<EvenementWithAvailability[]>;
    findWithAvailabilityById(evenementId: number): Promise<EvenementWithAvailability | null>;
    create(input: CreateEvenementInput, creatorId: number): Promise<Evenement | null>;
    deleteOwnedBy(evenementId: number, creatorId: number): Promise<DeleteEvenementResult>;
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
    cancel(evenementId: number, userId: number, reason: string, canCancelOther: boolean): Promise<CancelEvenementResult>;
}
