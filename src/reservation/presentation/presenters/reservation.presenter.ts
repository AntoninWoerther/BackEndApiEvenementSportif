import { presentEvenement } from '../../../profile/evenement/presentation/presenters/evenement.presenter';
import type { Reservation, ReservationWithEvenement } from '../../domain/reservation';

export const presentReservation = ({ id, evenementId, userId, createdAt }: Reservation): Reservation => {
    return { id, evenementId, userId, createdAt };
};

export const presentReservationWithEvenement = (reservation: ReservationWithEvenement): ReservationWithEvenement => {
    return {
        ...presentReservation(reservation),
        evenement: presentEvenement(reservation.evenement)
    };
};
