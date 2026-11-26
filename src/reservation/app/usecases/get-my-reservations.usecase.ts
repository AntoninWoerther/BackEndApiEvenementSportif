import type { ReservationWithEvenement } from '../../domain/reservation';
import type { ReservationGateway } from '../interfaces/reservation.gateway';

export type GetMyReservationsUseCase = (userId: number) => Promise<ReservationWithEvenement[]>;

export const makeGetMyReservationsUseCase = (
    gateway: Pick<ReservationGateway, 'listByUserId'>
): GetMyReservationsUseCase => {
    return (userId) => gateway.listByUserId(userId);
};
