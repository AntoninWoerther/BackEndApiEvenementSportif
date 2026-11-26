import { EvenementNotFoundError } from '../../../profile/evenement/domain/errors/evenement-not-found.error';
import { WaitlistEntryNotFoundError } from '../../domain/errors/waitlist.errors';
import type { ReservationParticipantInput } from '../inputs/reservation-participant.input';
import type { WaitlistGateway } from '../interfaces/waitlist.gateway';

export type LeaveWaitlistUseCase = (input: ReservationParticipantInput) => Promise<void>;

export const makeLeaveWaitlistUseCase = (gateway: Pick<WaitlistGateway, 'leave'>): LeaveWaitlistUseCase => {
    return async input => {
        switch (await gateway.leave(input)) {
            case 'left': return;
            case 'evenement-not-found': throw new EvenementNotFoundError();
            case 'entry-not-found': throw new WaitlistEntryNotFoundError();
        }
    };
};
