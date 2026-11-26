
import type { ChangePasswordUseCase } from '../../app/usecases/change-password.usecase';
import type { ChangeUserPermissionUseCase } from '../../app/usecases/change-user-permission.usecase';
import type { ExportUserPermissionChangesUseCase } from '../../app/usecases/export-user-permission-changes.usecase';
import { createUserUseCase } from '../../app/usecases/create-user.usecase';
import { deleteUserUseCase } from '../../app/usecases/delete-user.usecase';
import { getUserByIdUseCase } from '../../app/usecases/get-user-by-id.usecase';
import { getUsersUseCase } from '../../app/usecases/get-users.usecase';
import { InvalidUserIdError } from '../../domain/errors/invalid-user-id.error';
import { InvalidUserPermissionsError } from '../../domain/errors/invalid-user-permissions.error';
import { presentUser } from '../presenters/user.presenter';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { GrantUserPermissionDto } from '../dtos/grant-user-permission.dto';
import { UserToCreateDto } from '../dtos/user.dto';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { InvalidTokenError } from '../../../../auth/domain/errors/invalid-token.error';
import { ValidationFailedError } from '../../../../core/errors/validation-failed.error';

import type { Request, Response } from 'express';

const parseUserId = (value: string): number => {
    const id = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id <= 0) {
        throw new InvalidUserIdError();
    }

    return id;
};

const getAuthenticatedUserId = (req: Request): number => {
    const id = req.user?.id;
    if (id === undefined || !Number.isSafeInteger(id) || id <= 0) {
        throw new InvalidTokenError();
    }

    return id;
};

export const getUsers = async (req: Request, res: Response) => {

    const users = await getUsersUseCase();

    const usersPresenter = users.map(user => presentUser(user));

    return res.status(200).json(usersPresenter);
};

export const setUsers = async (req: Request, res: Response) => {

    // 1. Transformer le body en instance de DTO
    const data = plainToInstance(UserToCreateDto, req.body ?? {});

    // 2. Valider les propriétés
    const errors = await validate(data, {
        whitelist: true,
        forbidNonWhitelisted: true
    });

    if (errors.length > 0) {
        throw new ValidationFailedError(errors);
    }

    await createUserUseCase(data);

    return res.status(202).json({ message: 'Votre demande d’inscription a été reçue.' });
};

export const createChangePasswordController = (changePassword: ChangePasswordUseCase) => {
    return async (req: Request, res: Response) => {
        const userId = getAuthenticatedUserId(req);

        const data = plainToInstance(ChangePasswordDto, req.body ?? {});
        const errors = await validate(data, {
            whitelist: true,
            forbidNonWhitelisted: true
        });

        if (errors.length > 0) {
            throw new ValidationFailedError(errors);
        }

        await changePassword(userId, data);

        return res.status(200).json({ message: 'Mot de passe modifié avec succès.' });
    };
};

export const createGrantUserPermissionController = (grantPermission: ChangeUserPermissionUseCase) => {
    return async (req: Request<{ id: string }>, res: Response) => {
        const actorId = getAuthenticatedUserId(req);

        const userId = parseUserId(req.params.id);
        const data = plainToInstance(GrantUserPermissionDto, req.body ?? {});
        const errors = await validate(data, {
            whitelist: true,
            forbidNonWhitelisted: true
        });
        if (errors.length > 0) {
            throw new ValidationFailedError(errors);
        }

        const permissions = await grantPermission(actorId, userId, data.permissions);
        return res.status(200).json({ userId, permissions });
    };
};

export const createRevokeUserPermissionController = (revokePermission: ChangeUserPermissionUseCase) => {
    return async (req: Request<{ id: string; permission: string }>, res: Response) => {
        const actorId = getAuthenticatedUserId(req);
        const userId = parseUserId(req.params.id);
        if (!/^\d+$/.test(req.params.permission)) {
            throw new InvalidUserPermissionsError();
        }

        const permissions = await revokePermission(actorId, userId, Number(req.params.permission));
        return res.status(200).json({ userId, permissions });
    };
};

export const createExportUserPermissionChangesController = (exportChanges: ExportUserPermissionChangesUseCase) => {
    return async (_req: Request, res: Response) => {
        const changes = await exportChanges();
        return res
            .attachment('user-permission-changes.json')
            .set('Cache-Control', 'no-store')
            .status(200)
            .json(changes);
    };
};

export const delUser = async (req: Request<{ id: string }>, res: Response) => {
    const user = req.user;
    if (!user || user.permissions === undefined) {
        throw new InvalidTokenError();
    }

    const id = parseUserId(req.params.id);
    await deleteUserUseCase(id, { id: user.id, permissions: user.permissions });

    return res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
};

export const getUserById = async (req: Request<{ id: string }>, res: Response) => {
    const id = parseUserId(req.params.id);
    const user = await getUserByIdUseCase(id);

    return res.status(200).json(presentUser(user));
};
