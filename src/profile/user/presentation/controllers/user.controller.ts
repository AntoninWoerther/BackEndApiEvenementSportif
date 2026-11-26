
import type { ChangePasswordUseCase } from '../../app/usecases/change-password.usecase';
import type { ChangeUserAccountStatusUseCase } from '../../app/usecases/change-user-account-status.usecase';
import type { ChangeUserPermissionUseCase } from '../../app/usecases/change-user-permission.usecase';
import type { ExportUserPermissionChangesUseCase } from '../../app/usecases/export-user-permission-changes.usecase';
import type { CreateUserUseCase } from '../../app/usecases/create-user.usecase';
import type { DeleteUserUseCase } from '../../app/usecases/delete-user.usecase';
import type { GetUserByIdUseCase } from '../../app/usecases/get-user-by-id.usecase';
import type { GetUsersUseCase } from '../../app/usecases/get-users.usecase';
import { parseUserId } from '../routes/parse-user-id';
import { InvalidUserPermissionsError } from '../../domain/errors/invalid-user-permissions.error';
import {
    presentUser,
    presentUserAccountStatus,
    presentUserPermissionChange,
    presentUserPermissions
} from '../presenters/user.presenter';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { GrantUserPermissionDto } from '../dtos/grant-user-permission.dto';
import { UserToCreateDto } from '../dtos/user.dto';

import { InvalidTokenError } from '../../../../auth/domain/errors/invalid-token.error';
import { getAuthenticatedUser } from '../../../../auth/presentation/get-authenticated-user';
import { presentMessage } from '../../../../core/http/message.presenter';
import { validateBody } from '../../../../core/http/validate-body';

import type { Request, Response } from 'express';

export const createGetUsersController = (getUsers: GetUsersUseCase) => {
    return async (_req: Request, res: Response) => {
        const users = await getUsers();
        return res.status(200).json(users.map(presentUser));
    };
};

export const createUserController = (createUser: CreateUserUseCase) => {
    return async (req: Request, res: Response) => {
        const data = await validateBody(UserToCreateDto, req.body);

        await createUser(data);
        return res.status(202).json(presentMessage('Votre demande d’inscription a été reçue.'));
    };
};

export const createChangePasswordController = (changePassword: ChangePasswordUseCase) => {
    return async (req: Request, res: Response) => {
        const userId = getAuthenticatedUser(req).id;

        const data = await validateBody(ChangePasswordDto, req.body);

        await changePassword(userId, data);

        return res.status(200).json(presentMessage('Mot de passe modifié avec succès.'));
    };
};

export const createGrantUserPermissionController = (grantPermission: ChangeUserPermissionUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const actorId = getAuthenticatedUser(req).id;

        const userId = parseUserId(req.params.id);
        const data = await validateBody(GrantUserPermissionDto, req.body);

        const permissions = await grantPermission(actorId, userId, data.permissions);
        return res.status(200).json(presentUserPermissions(userId, permissions));
    };
};

export const createRevokeUserPermissionController = (revokePermission: ChangeUserPermissionUseCase) => {
    return async (req: Request<{ id: string; permission: string }>, res: Response) => {
        const actorId = getAuthenticatedUser(req).id;
        const userId = parseUserId(req.params.id);
        if (!/^\d+$/.test(req.params.permission)) {
            throw new InvalidUserPermissionsError();
        }

        const permissions = await revokePermission(actorId, userId, Number(req.params.permission));
        return res.status(200).json(presentUserPermissions(userId, permissions));
    };
};

export const createExportUserPermissionChangesController = (exportChanges: ExportUserPermissionChangesUseCase) => {
    return async (_req: Request, res: Response) => {
        const changes = await exportChanges();
        return res
            .attachment('user-permission-changes.json')
            .set('Cache-Control', 'no-store')
            .status(200)
            .json(changes.map(presentUserPermissionChange));
    };
};

export const createChangeUserAccountStatusController = (changeStatus: ChangeUserAccountStatusUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const actorId = getAuthenticatedUser(req).id;
        const userId = parseUserId(req.params.id);
        const suspended = await changeStatus(actorId, userId);

        return res.status(200).json(presentUserAccountStatus(userId, suspended));
    };
};

export const createDeleteUserController = (deleteUser: DeleteUserUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const user = getAuthenticatedUser(req);
        if (user.permissions === undefined) {
            throw new InvalidTokenError();
        }

        const id = parseUserId(req.params.id);
        await deleteUser(id, { id: user.id, permissions: user.permissions });
        return res.status(200).json(presentMessage('Utilisateur supprimé avec succès.'));
    };
};

export const createGetUserByIdController = (getUserById: GetUserByIdUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const id = parseUserId(req.params.id);
        const user = await getUserById(id);
        return res.status(200).json(presentUser(user));
    };
};
