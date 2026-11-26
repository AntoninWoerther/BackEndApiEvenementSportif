import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireUserPermission } from '../../../auth/infra/gards/user-permissions.middleware';
import { USER_PERMISSIONS } from '../../../profile/user/domain/permissions/user.permissions';
import type { CancelReservationUseCase } from '../../app/usecases/cancel-reservation.usecase';
import type { CreateReservationUseCase } from '../../app/usecases/create-reservation.usecase';
import type { GetEventParticipantsUseCase } from '../../app/usecases/get-event-participants.usecase';
import type { GetMyReservationsUseCase } from '../../app/usecases/get-my-reservations.usecase';
import type { RemoveEventParticipantUseCase } from '../../app/usecases/remove-event-participant.usecase';
import {
    cancelReservationController,
    createReservationController,
    getEventParticipantsController,
    getMyReservationsController,
    removeEventParticipantController
} from '../controllers/reservation.controller';

interface ReservationRouteDependencies {
    createReservation: CreateReservationUseCase;
    cancelReservation: CancelReservationUseCase;
    getMyReservations: GetMyReservationsUseCase;
    getEventParticipants: GetEventParticipantsUseCase;
    removeEventParticipant: RemoveEventParticipantUseCase;
    authMiddleware: RequestHandler;
    loadUserPermissions: RequestHandler;
}

export const createReservationRouter = ({
    createReservation,
    cancelReservation,
    getMyReservations,
    getEventParticipants,
    removeEventParticipant,
    authMiddleware,
    loadUserPermissions
}: ReservationRouteDependencies) => {
    const router = Router();

    router.get('/me/reservations', authMiddleware, getMyReservationsController(getMyReservations));
    router.post('/evenements/:evenementId/reservations', authMiddleware, createReservationController(createReservation));
    router.delete('/evenements/:evenementId/reservations/me', authMiddleware, cancelReservationController(cancelReservation));

    router.get(
        '/evenements/:evenementId/participants',
        authMiddleware,
        loadUserPermissions,
        getEventParticipantsController(getEventParticipants)
    );
    router.delete(
        '/evenements/:evenementId/participants/:userId',
        authMiddleware,
        loadUserPermissions,
        requireUserPermission(USER_PERMISSIONS.REMOVE_EVENT_PARTICIPANTS),
        removeEventParticipantController(removeEventParticipant)
    );

    return router;
};
