import type { Request, Response } from 'express';
import { InvalidTokenError } from '../../../auth/domain/errors/invalid-token.error';
import { parseEvenementId } from '../../../profile/evenement/presentation/routes/parse-evenement-id';
import type { ReservationParticipantInput } from '../../app/inputs/reservation-participant.input';
import type { CancelReservationUseCase } from '../../app/usecases/cancel-reservation.usecase';
import type { CreateReservationUseCase } from '../../app/usecases/create-reservation.usecase';
import type { GetMyReservationsUseCase } from '../../app/usecases/get-my-reservations.usecase';
import { presentReservation, presentReservationWithEvenement } from '../presenters/reservation.presenter';

type ReservationRequest = Request<{ evenementId: string }>;

const getAuthenticatedUserId = (req: Request): number => {
    const userId = req.user?.id;
    if (userId === undefined || !Number.isSafeInteger(userId) || userId <= 0) {
        throw new InvalidTokenError();
    }

    return userId;
};

const getReservationParticipant = (req: ReservationRequest): ReservationParticipantInput => {
    const userId = getAuthenticatedUserId(req);
    return { evenementId: parseEvenementId(req.params.evenementId), userId };
};

export const getMyReservationsController = (getMyReservations: GetMyReservationsUseCase) => {
    return async (req: Request, res: Response) => {
        const reservations = await getMyReservations(getAuthenticatedUserId(req));
        return res.status(200).set('Cache-Control', 'no-store').json(reservations.map(presentReservationWithEvenement));
    };
};

export const createReservationController = (createReservation: CreateReservationUseCase) => {
    return async (req: ReservationRequest, res: Response) => {
        const reservation = await createReservation(getReservationParticipant(req));

        return res.status(201).json(presentReservation(reservation));
    };
};

export const cancelReservationController = (cancelReservation: CancelReservationUseCase) => {
    return async (req: ReservationRequest, res: Response) => {
        await cancelReservation(getReservationParticipant(req));
        return res.status(200).json({ message: 'Participation annulée avec succès.' });
    };
};
