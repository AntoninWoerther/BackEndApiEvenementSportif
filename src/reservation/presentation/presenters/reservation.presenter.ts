import { presentEvenement } from '../../../profile/evenement/presentation/presenters/evenement.presenter';
import type { Reservation, ReservationWithEvenementStatus } from '../../domain/reservation';

export const presentReservation = ({ id, evenementId, userId, createdAt }: Reservation): Reservation => {
    return { id, evenementId, userId, createdAt };
};

export const presentReservationWithEvenement = (reservation: ReservationWithEvenementStatus): ReservationWithEvenementStatus => {
    return {
        ...presentReservation(reservation),
        evenement: {
            ...presentEvenement(reservation.evenement),
            status: reservation.evenement.status
        }
    };
};
