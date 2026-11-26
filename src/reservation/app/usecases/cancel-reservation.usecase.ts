import { EvenementNotFoundError } from '../../../profile/evenement/domain/errors/evenement-not-found.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import type { ReservationParticipantInput } from '../inputs/reservation-participant.input';
import type { ReservationGateway } from '../interfaces/reservation.gateway';
import { publishWaitlistPromotion } from '../publish-waitlist-promotion';

export type CancelReservationUseCase = (input: ReservationParticipantInput) => Promise<void>;

export const makeCancelReservationUseCase = (gateway: Pick<ReservationGateway, 'cancel'>): CancelReservationUseCase => {
    return async (input) => {
        const result = await gateway.cancel(input);

        switch (result.status) {
            case 'cancelled':
                publishWaitlistPromotion(result.promotion);
                return;
            case 'evenement-not-found':
                throw new EvenementNotFoundError();
            case 'reservation-not-found':
                throw new ReservationNotFoundError();
        }
    };
};
