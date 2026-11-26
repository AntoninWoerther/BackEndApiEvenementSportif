import type { EventPublisher } from '../../../core/bus/event-bus';
import { EvenementNotFoundError } from '../../../profile/evenement/domain/errors/evenement-not-found.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import type { WaitlistEvents } from '../../domain/events/waitlist-promoted.event';
import type { ReservationParticipantInput } from '../inputs/reservation-participant.input';
import type { ReservationGateway } from '../interfaces/reservation.gateway';
import { publishWaitlistPromotion } from '../publish-waitlist-promotion';

export type CancelReservationUseCase = (input: ReservationParticipantInput) => Promise<void>;

export const makeCancelReservationUseCase = (
    gateway: Pick<ReservationGateway, 'cancel'>,
    events: EventPublisher<WaitlistEvents>
): CancelReservationUseCase => {
    return async (input) => {
        const result = await gateway.cancel(input);

        switch (result.status) {
            case 'cancelled':
                publishWaitlistPromotion(events, result.promotion);
                return;
            case 'evenement-not-found':
                throw new EvenementNotFoundError();
            case 'reservation-not-found':
                throw new ReservationNotFoundError();
        }
    };
};
