import type { GetAuthenticatedUserUseCase } from '../../app/usecases/get-authenticated-user.usecase';
import type { LoginUseCase } from '../../app/usecases/login.usecase';
import type { LogoutAllUseCase } from '../../app/usecases/logout-all.usecase';
import type { LogoutUseCase } from '../../app/usecases/logout.usecase';
import { InvalidTokenError } from '../../domain/errors/invalid-token.error';
import type { RefreshUseCase } from '../../app/usecases/refresh.usecase';
import { LoginDto } from '../dtos/login.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { presentUser } from '../../../profile/user/presentation/presenters/user.presenter';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { UserNotFound } from '../../../profile/user/domain/errors/user-not-found.error';
import { ValidationFailedError } from '../../../core/errors/validation-failed.error';

import { presentMessage } from '../../../core/http/message.presenter';
import { presentAuthTokens, presentLogin } from '../presenters/auth.presenter';
import type { Request, Response } from 'express';

export const createLoginController = (loginUseCase: LoginUseCase) => async (req: Request, res: Response) => {

    // 1. Transformer le body en instance de DTO
    const credentials = plainToInstance(LoginDto, req.body ?? {});

    // 2. Valider les identifiants
    const errors = await validate(credentials, {
        whitelist: true,
        forbidNonWhitelisted: true
    });

    if (errors.length > 0) {
        throw new ValidationFailedError(errors);
    }

    // 3. Exécuter le cas d’utilisation de connexion
    const result = await loginUseCase(credentials);

    // 4. Retourner le résultat
    return res.status(200).json(presentLogin(result));
};

export const createGetMeController = (getAuthenticatedUser: GetAuthenticatedUserUseCase) => {
    return async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (userId === undefined || !Number.isSafeInteger(userId) || userId <= 0) {
            throw new InvalidTokenError();
        }

        const user = await getAuthenticatedUser(userId);
        if (!user) {
            throw new UserNotFound();
        }

        return res.status(200).json(presentUser(user));
    };
};

export const createRefreshController = (refreshUseCase: RefreshUseCase) => async (req: Request, res: Response) => {
    const data = plainToInstance(RefreshTokenDto, req.body ?? {});
    const errors = await validate(data, {
        whitelist: true,
        forbidNonWhitelisted: true
    });
    if (errors.length > 0) {
        throw new ValidationFailedError(errors);
    }

    const result = await refreshUseCase(data.refreshToken);
    return res.status(200).json(presentAuthTokens(result));
};

export const createLogoutController = (logout: LogoutUseCase) => async (req: Request, res: Response) => {
    const data = plainToInstance(RefreshTokenDto, req.body ?? {});
    const errors = await validate(data, {
        whitelist: true,
        forbidNonWhitelisted: true
    });
    if (errors.length > 0) {
        throw new ValidationFailedError(errors);
    }

    await logout(data.refreshToken);

    return res.status(200).json(presentMessage('Déconnexion réussie.'));
};

export const createLogoutAllController = (logoutAll: LogoutAllUseCase) => async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (userId === undefined) {
        throw new InvalidTokenError();
    }

    await logoutAll(userId);
    return res.status(200).json(presentMessage('Déconnexion de tous les appareils réussie.'));
};
