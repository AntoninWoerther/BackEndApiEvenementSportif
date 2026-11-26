import type { Request, Response } from 'express';
import { InvalidTokenError } from '../../../../auth/domain/errors/invalid-token.error';
import { ValidationFailedError } from '../../../../core/errors/validation-failed.error';
import { presentMessage } from '../../../../core/http/message.presenter';
import { validateBody } from '../../../../core/http/validate-body';
import type { CancelEvenementUseCase } from '../../app/usecases/cancel-evenement.usecase';
import type { CreateEvenementUseCase } from '../../app/usecases/create-evenement.usecase';
import type { DeleteEvenementUseCase } from '../../app/usecases/delete-evenement.usecase';
import type { GetEvenementByIdUseCase } from '../../app/usecases/get-evenement-by-id.usecase';
import type { GetEvenementsUseCase } from '../../app/usecases/get-evenements.usecase';
import type { UpdateEvenementDateUseCase } from '../../app/usecases/update-evenement-date.usecase';
import type { UpdateEvenementDetailsUseCase } from '../../app/usecases/update-evenement-details.usecase';
import { parseEvenementId } from '../routes/parse-evenement-id';
import { CancelEvenementDto } from '../dtos/cancel-evenement.dto';
import { CreateEvenementDto } from '../dtos/create-evenement.dto';
import { EvenementDateDto } from '../dtos/evenement-date.dto';
import { UpdateEvenementDetailsDto } from '../dtos/update-evenement-details.dto';
import { presentEvenement, presentEvenementDateUpdate, presentEvenementWithAvailability } from '../presenters/evenement.presenter';

const getAuthenticatedUserId = (req: Request): number => {
    const userId = req.user?.id;
    if (userId === undefined || !Number.isSafeInteger(userId) || userId <= 0) {
        throw new InvalidTokenError();
    }

    return userId;
};

export const getEvenementsController = (getEvenements: GetEvenementsUseCase) => {
    return async (_req: Request, res: Response) => {
        const evenements = await getEvenements();
        return res.status(200).json(evenements.map(presentEvenementWithAvailability));
    };
};

export const getEvenementByIdController = (getEvenementById: GetEvenementByIdUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const id = parseEvenementId(req.params.id);
        const evenement = await getEvenementById(id);
        return res.status(200).json(presentEvenementWithAvailability(evenement));
    };
};

export const createEvenementController = (createEvenement: CreateEvenementUseCase) => {
    return async (req: Request, res: Response) => {
        const creatorId = getAuthenticatedUserId(req);
        const input = await validateBody(CreateEvenementDto, req.body);

        const evenement = await createEvenement(input, creatorId);
        return res.status(201).json(presentEvenement(evenement));
    };
};

export const cancelEvenementController = (cancelEvenement: CancelEvenementUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const userId = getAuthenticatedUserId(req);
        const id = parseEvenementId(req.params.id);
        const { reason } = await validateBody(CancelEvenementDto, req.body);
        const evenement = await cancelEvenement(id, userId, reason, req.user?.permissions ?? 0);
        return res.status(200).json(presentEvenement(evenement));
    };
};

export const deleteEvenementController = (deleteEvenement: DeleteEvenementUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const userId = getAuthenticatedUserId(req);
        const id = parseEvenementId(req.params.id);

        await deleteEvenement(id, userId);
        return res.status(200).json(presentMessage('Événement supprimé avec succès.'));
    };
};

export const updateEvenementDetailsController = (updateEvenementDetails: UpdateEvenementDetailsUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const userId = getAuthenticatedUserId(req);
        const id = parseEvenementId(req.params.id);
        const input = await validateBody(UpdateEvenementDetailsDto, req.body);

        if (input.description === undefined && input.location === undefined && input.capacity === undefined) {
            throw new ValidationFailedError([{
                property: 'body',
                constraints: { emptyPatch: 'Renseignez une description, un lieu ou une capacité.' }
            }]);
        }

        const evenement = await updateEvenementDetails(id, userId, input, req.user?.permissions ?? 0);
        return res.status(200).json(presentEvenement(evenement));
    };
};

export const updateEvenementDateController = (updateEvenementDate: UpdateEvenementDateUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const userId = getAuthenticatedUserId(req);
        const id = parseEvenementId(req.params.id);
        const { date } = await validateBody(EvenementDateDto, req.body);

        await updateEvenementDate(id, userId, date, req.user?.permissions ?? 0);
        return res.status(200).json(presentEvenementDateUpdate(id, date));
    };
};
