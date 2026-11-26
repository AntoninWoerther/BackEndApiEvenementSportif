import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireAnyUserPermission, requireUserPermission } from '../../../../auth/infra/gards/user-permissions.middleware';
import { USER_PERMISSIONS } from '../../../user/domain/permissions/user.permissions';
import type { CreateEvenementUseCase } from '../../app/usecases/create-evenement.usecase';
import type { DeleteEvenementUseCase } from '../../app/usecases/delete-evenement.usecase';
import type { GetEvenementByIdUseCase } from '../../app/usecases/get-evenement-by-id.usecase';
import type { GetEvenementsUseCase } from '../../app/usecases/get-evenements.usecase';
import type { UpdateEvenementDateUseCase } from '../../app/usecases/update-evenement-date.usecase';
import type { UpdateEvenementDetailsUseCase } from '../../app/usecases/update-evenement-details.usecase';
import {
    createEvenementController,
    deleteEvenementController,
    getEvenementByIdController,
    getEvenementsController,
    updateEvenementDateController,
    updateEvenementDetailsController
} from '../controllers/evenement.controller';

interface EvenementRouteDependencies {
    authMiddleware: RequestHandler;
    loadUserPermissions: RequestHandler;
    createEvenement: CreateEvenementUseCase;
    deleteEvenement: DeleteEvenementUseCase;
    getEvenementById: GetEvenementByIdUseCase;
    getEvenements: GetEvenementsUseCase;
    updateEvenementDate: UpdateEvenementDateUseCase;
    updateEvenementDetails: UpdateEvenementDetailsUseCase;
}

export const createEvenementRouter = ({
    createEvenement,
    deleteEvenement,
    getEvenementById,
    getEvenements,
    updateEvenementDate,
    updateEvenementDetails,
    authMiddleware,
    loadUserPermissions
}: EvenementRouteDependencies) => {
    const router = Router();
    const updatePermissions = [
        authMiddleware,
        loadUserPermissions,
        requireAnyUserPermission(USER_PERMISSIONS.UPDATE_EVENT, USER_PERMISSIONS.UPDATE_OTHER_EVENTS)
    ];

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
    router.patch('/:id', ...updatePermissions, updateEvenementDetailsController(updateEvenementDetails));
    router.patch('/:id/date', ...updatePermissions, updateEvenementDateController(updateEvenementDate));

    return router;
};
