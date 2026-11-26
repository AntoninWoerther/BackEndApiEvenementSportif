import { plainToInstance } from 'class-transformer';
import type { ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import type { Request, Response } from 'express';
import { InvalidTokenError } from '../../../../auth/domain/errors/invalid-token.error';
import { ValidationFailedError } from '../../../../core/errors/validation-failed.error';
import type { CreateEvenementUseCase } from '../../app/usecases/create-evenement.usecase';
import type { DeleteEvenementUseCase } from '../../app/usecases/delete-evenement.usecase';
import type { GetEvenementByIdUseCase } from '../../app/usecases/get-evenement-by-id.usecase';
import type { GetEvenementsUseCase } from '../../app/usecases/get-evenements.usecase';
import type { UpdateEvenementDateUseCase } from '../../app/usecases/update-evenement-date.usecase';
import { parseEvenementId } from '../routes/parse-evenement-id';
import { CreateEvenementDto } from '../dtos/create-evenement.dto';
import { EvenementDateDto } from '../dtos/evenement-date.dto';
import { presentEvenement, presentEvenementWithAvailability } from '../presenters/evenement.presenter';

const getAuthenticatedUserId = (req: Request): number => {
    const userId = req.user?.id;
    if (userId === undefined || !Number.isSafeInteger(userId) || userId <= 0) {
        throw new InvalidTokenError();
    }

    return userId;
};

const validateEvenementBody = async <T extends object>(dto: ClassConstructor<T>, body: unknown): Promise<T> => {
    const input = plainToInstance(dto, body ?? {});
    const errors = await validate(input, {
        whitelist: true,
        forbidNonWhitelisted: true
    });

    if (errors.length > 0) {
        throw new ValidationFailedError(errors);
    }

    return input;
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
        const input = await validateEvenementBody(CreateEvenementDto, req.body);

        const evenement = await createEvenement(input, creatorId);
        return res.status(201).json(presentEvenement(evenement));
    };
};

export const deleteEvenementController = (deleteEvenement: DeleteEvenementUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const userId = getAuthenticatedUserId(req);
        const id = parseEvenementId(req.params.id);

        await deleteEvenement(id, userId);
        return res.status(200).json({ message: 'Événement supprimé avec succès.' });
    };
};

export const updateEvenementDateController = (updateEvenementDate: UpdateEvenementDateUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const userId = getAuthenticatedUserId(req);
        const id = parseEvenementId(req.params.id);
        const { date } = await validateEvenementBody(EvenementDateDto, req.body);

        await updateEvenementDate(id, userId, date, req.user?.permissions ?? 0);
        return res.status(200).json({ id, date, message: 'Date de l’événement modifiée avec succès.' });
    };
};
