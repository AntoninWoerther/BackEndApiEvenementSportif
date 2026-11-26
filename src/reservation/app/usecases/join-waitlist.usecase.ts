import { InvalidTokenError } from '../../../auth/domain/errors/invalid-token.error';
import { EvenementCancelledError } from '../../../profile/evenement/domain/errors/evenement-cancelled.error';
import { EvenementNotFoundError } from '../../../profile/evenement/domain/errors/evenement-not-found.error';
import { EvenementPastError } from '../../domain/errors/evenement-past.error';
import { ReservationAlreadyExistsError } from '../../domain/errors/reservation-already-exists.error';
import { WaitlistAlreadyJoinedError, WaitlistPlaceAvailableError } from '../../domain/errors/waitlist.errors';
import type { WaitlistEntry } from '../../domain/waitlist-entry';
import type { ReservationParticipantInput } from '../inputs/reservation-participant.input';
import type { WaitlistGateway } from '../interfaces/waitlist.gateway';

export type JoinWaitlistUseCase = (input: ReservationParticipantInput) => Promise<WaitlistEntry>;

export const makeJoinWaitlistUseCase = (gateway: Pick<WaitlistGateway, 'join'>): JoinWaitlistUseCase => {
    return async input => {
        const result = await gateway.join(input);
        switch (result.status) {
            case 'joined': return result.entry;
            case 'evenement-not-found': throw new EvenementNotFoundError();
            case 'evenement-past': throw new EvenementPastError();
            case 'evenement-cancelled': throw new EvenementCancelledError();
            case 'already-registered': throw new ReservationAlreadyExistsError();
            case 'already-queued': throw new WaitlistAlreadyJoinedError();
            case 'place-available': throw new WaitlistPlaceAvailableError();
            case 'user-not-found': throw new InvalidTokenError();
        }
    };
};
