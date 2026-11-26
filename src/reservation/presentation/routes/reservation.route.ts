import { Router } from 'express';
import { authMiddleware } from '../../../auth/infra/gards/auth.middleware';
import type { CancelReservationUseCase } from '../../app/usecases/cancel-reservation.usecase';
import type { CreateReservationUseCase } from '../../app/usecases/create-reservation.usecase';
import type { GetMyReservationsUseCase } from '../../app/usecases/get-my-reservations.usecase';
import {
    cancelReservationController,
    createReservationController,
    getMyReservationsController
} from '../controllers/reservation.controller';

interface ReservationUseCases {
    createReservation: CreateReservationUseCase;
    cancelReservation: CancelReservationUseCase;
    getMyReservations: GetMyReservationsUseCase;
}

export const createReservationRouter = ({
    createReservation,
    cancelReservation,
    getMyReservations
}: ReservationUseCases) => {
    const router = Router();

    router.get('/me/reservations', authMiddleware, getMyReservationsController(getMyReservations));
    router.post('/evenements/:evenementId/reservations', authMiddleware, createReservationController(createReservation));
    router.delete('/evenements/:evenementId/reservations/me', authMiddleware, cancelReservationController(cancelReservation));

    return router;
};
