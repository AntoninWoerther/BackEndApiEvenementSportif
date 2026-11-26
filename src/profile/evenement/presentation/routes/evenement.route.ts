import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireAnyUserPermission, requireUserPermission } from '../../../../auth/infra/gards/user-permissions.middleware';
import { USER_PERMISSIONS } from '../../../user/domain/permissions/user.permissions';
import { authMiddleware } from '../../../../auth/infra/gards/auth.middleware';
import type { CreateEvenementUseCase } from '../../app/usecases/create-evenement.usecase';
import type { DeleteEvenementUseCase } from '../../app/usecases/delete-evenement.usecase';
import type { GetEvenementByIdUseCase } from '../../app/usecases/get-evenement-by-id.usecase';
import type { GetEvenementsUseCase } from '../../app/usecases/get-evenements.usecase';
import type { UpdateEvenementDateUseCase } from '../../app/usecases/update-evenement-date.usecase';
import {
    createEvenementController,
    deleteEvenementController,
    getEvenementByIdController,
    getEvenementsController,
    updateEvenementDateController
} from '../controllers/evenement.controller';

interface EvenementRouteDependencies {
    loadUserPermissions: RequestHandler;
    createEvenement: CreateEvenementUseCase;
    deleteEvenement: DeleteEvenementUseCase;
    getEvenementById: GetEvenementByIdUseCase;
    getEvenements: GetEvenementsUseCase;
    updateEvenementDate: UpdateEvenementDateUseCase;
}

export const createEvenementRouter = ({
    createEvenement,
    deleteEvenement,
    getEvenementById,
    getEvenements,
    updateEvenementDate,
    loadUserPermissions
}: EvenementRouteDependencies) => {
    const router = Router();

    router.get('/', getEvenementsController(getEvenements));
    router.get('/:id', getEvenementByIdController(getEvenementById));

    router.post(
        '/',
        authMiddleware,
        loadUserPermissions,
        requireUserPermission(USER_PERMISSIONS.CREATE_EVENT),
        createEvenementController(createEvenement)
    );
    router.delete('/:id', authMiddleware, deleteEvenementController(deleteEvenement));
    router.patch(
        '/:id/date',
        authMiddleware,
        loadUserPermissions,
        requireAnyUserPermission(USER_PERMISSIONS.UPDATE_EVENT, USER_PERMISSIONS.UPDATE_OTHER_EVENTS),
        updateEvenementDateController(updateEvenementDate)
    );

    return router;
};
