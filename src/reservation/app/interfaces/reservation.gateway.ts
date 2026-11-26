import type { EventParticipant } from '../../domain/event-participant';
import type { WaitlistPromotedEvent } from '../../domain/events/waitlist-promoted.event';
import type { Reservation, ReservationWithEvenement } from '../../domain/reservation';
import type { ReservationParticipantInput } from '../inputs/reservation-participant.input';

export type CreateReservationResult =
    | { status: 'created'; reservation: Reservation }
    | { status: 'evenement-not-found' }
    | { status: 'already-registered' }
    | { status: 'evenement-full' }
    | { status: 'evenement-past' }
    | { status: 'evenement-cancelled' }
    | { status: 'user-not-found' };

export type CancelReservationResult =
    | { status: 'cancelled'; promotion: WaitlistPromotedEvent | null }
    | { status: 'evenement-not-found' }
    | { status: 'reservation-not-found' };

export interface ReservationGateway {
    listByUserId(userId: number): Promise<ReservationWithEvenement[]>;
    create(input: ReservationParticipantInput): Promise<CreateReservationResult>;
    cancel(input: ReservationParticipantInput): Promise<CancelReservationResult>;
    findEvenementOwner(evenementId: number): Promise<{ creatorId: number | null } | null>;
    listEventParticipants(evenementId: number): Promise<EventParticipant[]>;
    findParticipantEmails(evenementId: number): Promise<string[]>;
}
