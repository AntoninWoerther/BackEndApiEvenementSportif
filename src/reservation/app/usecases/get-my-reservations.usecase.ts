import { formatParisDay } from '../../../core/date/paris-day';
import type { ReservationWithEvenementStatus } from '../../domain/reservation';
import type { ReservationGateway } from '../interfaces/reservation.gateway';

export type GetMyReservationsUseCase = (userId: number) => Promise<ReservationWithEvenementStatus[]>;

export const makeGetMyReservationsUseCase = (
    gateway: Pick<ReservationGateway, 'listByUserId'>
): GetMyReservationsUseCase => {
    return async (userId) => {
        const reservations = await gateway.listByUserId(userId);
        const today = formatParisDay(new Date());

        return reservations.map(reservation => {
            const { date } = reservation.evenement;
            const status = date < today ? 'finished' : date === today ? 'today' : 'upcoming';
            return {
                ...reservation,
                evenement: { ...reservation.evenement, status }
            };
        });
    };
};
