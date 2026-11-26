import type { Request, Response } from 'express';
import { InvalidTokenError } from '../../../auth/domain/errors/invalid-token.error';
import { presentMessage } from '../../../core/http/message.presenter';
import { parseEvenementId } from '../../../profile/evenement/presentation/routes/parse-evenement-id';
import { parseUserId } from '../../../profile/user/presentation/routes/parse-user-id';
import type { ReservationParticipantInput } from '../../app/inputs/reservation-participant.input';
import type { CancelReservationUseCase } from '../../app/usecases/cancel-reservation.usecase';
import type { CreateReservationUseCase } from '../../app/usecases/create-reservation.usecase';
import type { GetEventParticipantsUseCase } from '../../app/usecases/get-event-participants.usecase';
import type { GetMyReservationsUseCase } from '../../app/usecases/get-my-reservations.usecase';
import type { JoinWaitlistUseCase } from '../../app/usecases/join-waitlist.usecase';
import type { LeaveWaitlistUseCase } from '../../app/usecases/leave-waitlist.usecase';
import type { ListWaitlistUseCase } from '../../app/usecases/list-waitlist.usecase';
import type { MoveWaitlistEntryUpUseCase } from '../../app/usecases/move-waitlist-entry-up.usecase';
import { InvalidWaitlistEntryIdError } from '../../domain/errors/waitlist.errors';
import type { RemoveEventParticipantUseCase } from '../../app/usecases/remove-event-participant.usecase';
import {
    presentEventParticipant, presentReservation, presentReservationWithEvenement,
    presentWaitlistEntry, presentWaitlistParticipant
} from '../presenters/reservation.presenter';

type ReservationRequest = Request<{ evenementId: string }>;

const getAuthenticatedUserId = (req: Request): number => {
    const userId = req.user?.id;
    if (userId === undefined || !Number.isSafeInteger(userId) || userId <= 0) {
        throw new InvalidTokenError();
    }

    return userId;
};

const getActorPermissions = (req: Request): number => {
    const permissions = req.user?.permissions;
    if (permissions === undefined) {
        throw new InvalidTokenError();
    }
    return permissions;
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
        return res.status(200).json(presentMessage('Participation annulée avec succès.'));
    };
};

export const getEventParticipantsController = (getEventParticipants: GetEventParticipantsUseCase) => {
    return async (req: ReservationRequest, res: Response) => {
        const id = getAuthenticatedUserId(req);
        const permissions = getActorPermissions(req);

        const evenementId = parseEvenementId(req.params.evenementId);
        const participants = await getEventParticipants(evenementId, { id, permissions });
        return res.status(200).set('Cache-Control', 'no-store').json(participants.map(presentEventParticipant));
    };
};

export const joinWaitlistController = (joinWaitlist: JoinWaitlistUseCase) => {
    return async (req: ReservationRequest, res: Response) => {
        const entry = await joinWaitlist(getReservationParticipant(req));
        return res.status(201).json(presentWaitlistEntry(entry));
    };
};

export const leaveWaitlistController = (leaveWaitlist: LeaveWaitlistUseCase) => {
    return async (req: ReservationRequest, res: Response) => {
        await leaveWaitlist(getReservationParticipant(req));
        return res.status(200).json(presentMessage('Vous avez quitté la file d’attente.'));
    };
};

export const listWaitlistController = (listWaitlist: ListWaitlistUseCase) => {
    return async (req: ReservationRequest, res: Response) => {
        const { evenementId, userId } = getReservationParticipant(req);
        const participants = await listWaitlist(evenementId, userId, getActorPermissions(req));
        return res.status(200).set('Cache-Control', 'no-store').json(participants.map(presentWaitlistParticipant));
    };
};

export const moveWaitlistEntryUpController = (moveUp: MoveWaitlistEntryUpUseCase) => {
    return async (req: Request<{ evenementId: string; entryId: string }>, res: Response) => {
        const { evenementId, userId } = getReservationParticipant(req);
        const entryId = Number(req.params.entryId);
        if (!/^\d+$/.test(req.params.entryId) || !Number.isSafeInteger(entryId) || entryId <= 0) {
            throw new InvalidWaitlistEntryIdError();
        }

        const entry = await moveUp(evenementId, entryId, userId, getActorPermissions(req));
        return res.status(200).json(presentWaitlistEntry(entry));
    };
};

export const removeEventParticipantController = (removeEventParticipant: RemoveEventParticipantUseCase) => {
    return async (req: Request<{ evenementId: string; userId: string }>, res: Response) => {
        const evenementId = parseEvenementId(req.params.evenementId);
        const userId = parseUserId(req.params.userId);

        await removeEventParticipant({ evenementId, userId });
        return res.status(200).json(presentMessage('Participant retiré de l’événement.'));
    };
};
