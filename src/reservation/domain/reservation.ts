import type { Evenement } from '../../profile/evenement/domain/evenement';

export interface Reservation {
    id: number;
    evenementId: number;
    userId: number;
    createdAt: Date;
}

export interface ReservationWithEvenement extends Reservation {
    evenement: Evenement;
}
