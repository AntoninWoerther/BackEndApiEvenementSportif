import { InvalidTokenError } from '../../../auth/domain/errors/invalid-token.error';
import { EvenementNotFoundError } from '../../../profile/evenement/domain/errors/evenement-not-found.error';
import { EvenementFullError } from '../../domain/errors/evenement-full.error';
import { ReservationAlreadyExistsError } from '../../domain/errors/reservation-already-exists.error';
import type { Reservation } from '../../domain/reservation';
import type { ReservationParticipantInput } from '../inputs/reservation-participant.input';
import type { ReservationGateway } from '../interfaces/reservation.gateway';

export type CreateReservationUseCase = (input: ReservationParticipantInput) => Promise<Reservation>;

export const makeCreateReservationUseCase = (gateway: ReservationGateway): CreateReservationUseCase => {
    return async (input) => {
        const result = await gateway.create(input);

        switch (result.status) {
            case 'created':
                return result.reservation;
            case 'evenement-not-found':
                throw new EvenementNotFoundError();
            case 'already-registered':
                throw new ReservationAlreadyExistsError();
            case 'evenement-full':
                throw new EvenementFullError();
            case 'user-not-found':
                throw new InvalidTokenError();
        }
    };
};
