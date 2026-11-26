import type { Reservation, ReservationWithEvenement } from '../../domain/reservation';
import type { ReservationParticipantInput } from '../inputs/reservation-participant.input';

export type CreateReservationResult =
    | { status: 'created'; reservation: Reservation }
    | { status: 'evenement-not-found' }
    | { status: 'already-registered' }
    | { status: 'evenement-full' }
    | { status: 'evenement-past' }
    | { status: 'user-not-found' };

export type CancelReservationResult = 'cancelled' | 'evenement-not-found' | 'reservation-not-found';

export interface ReservationGateway {
    listByUserId(userId: number): Promise<ReservationWithEvenement[]>;
    create(input: ReservationParticipantInput): Promise<CreateReservationResult>;
    cancel(input: ReservationParticipantInput): Promise<CancelReservationResult>;
    findParticipantEmails(evenementId: number): Promise<string[]>;
}
