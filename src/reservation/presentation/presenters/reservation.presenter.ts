import { presentEvenement } from '../../../profile/evenement/presentation/presenters/evenement.presenter';
import type { EventParticipant } from '../../domain/event-participant';
import type { Reservation, ReservationWithEvenementStatus } from '../../domain/reservation';
import type { WaitlistEntry, WaitlistParticipant } from '../../domain/waitlist-entry';

export const presentReservation = ({ id, evenementId, userId, createdAt }: Reservation): Reservation => {
    return { id, evenementId, userId, createdAt };
};

export const presentReservationWithEvenement = (reservation: ReservationWithEvenementStatus) => {
    return {
        ...presentReservation(reservation),
        evenement: {
            ...presentEvenement(reservation.evenement),
            status: reservation.evenement.status
        }
    };
};

export const presentEventParticipant = ({ name, firstname }: EventParticipant): EventParticipant => {
    return { name, firstname };
};

export const presentWaitlistEntry = ({ id, position }: WaitlistEntry): WaitlistEntry => {
    return { id, position };
};

export const presentWaitlistParticipant = (participant: WaitlistParticipant): WaitlistParticipant => {
    return { ...presentWaitlistEntry(participant), ...presentEventParticipant(participant) };
};
