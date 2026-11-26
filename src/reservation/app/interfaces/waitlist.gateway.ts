import type { WaitlistEntry, WaitlistParticipant } from '../../domain/waitlist-entry';
import type { ReservationParticipantInput } from '../inputs/reservation-participant.input';

type ClosedEventResult = { status: 'evenement-cancelled' } | { status: 'evenement-past' };
type MissingEventResult = { status: 'evenement-not-found' };
type ForbiddenResult = { status: 'forbidden' };

export type JoinWaitlistResult =
    | { status: 'joined'; entry: WaitlistEntry }
    | { status: 'already-registered' | 'already-queued' | 'place-available' | 'user-not-found' }
    | MissingEventResult | ClosedEventResult;

export type ListWaitlistResult = { status: 'listed'; entries: WaitlistParticipant[] } | MissingEventResult | ForbiddenResult;
export type MoveWaitlistEntryUpResult =
    | { status: 'position'; entry: WaitlistEntry }
    | { status: 'entry-not-found' }
    | MissingEventResult | ForbiddenResult | ClosedEventResult;

export interface WaitlistGateway {
    join(input: ReservationParticipantInput): Promise<JoinWaitlistResult>;
    leave(input: ReservationParticipantInput): Promise<'left' | 'evenement-not-found' | 'entry-not-found'>;
    list(evenementId: number, actorId: number, canManageOthers: boolean): Promise<ListWaitlistResult>;
    moveUp(evenementId: number, entryId: number, actorId: number, canManageOthers: boolean): Promise<MoveWaitlistEntryUpResult>;
}
