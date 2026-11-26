import { EvenementNotFoundError } from '../../../profile/evenement/domain/errors/evenement-not-found.error';
import { ReservationParticipantNotFoundError } from '../../domain/errors/reservation-participant-not-found.error';
import type { ReservationParticipantInput } from '../inputs/reservation-participant.input';
import type { ReservationGateway } from '../interfaces/reservation.gateway';

export type RemoveEventParticipantUseCase = (input: ReservationParticipantInput) => Promise<void>;

export const makeRemoveEventParticipantUseCase = (
    gateway: Pick<ReservationGateway, 'cancel'>
): RemoveEventParticipantUseCase => {
    return async (input) => {
        switch (await gateway.cancel(input)) {
            case 'cancelled':
                return;
            case 'evenement-not-found':
                throw new EvenementNotFoundError();
            case 'reservation-not-found':
                throw new ReservationParticipantNotFoundError();
        }
    };
};
