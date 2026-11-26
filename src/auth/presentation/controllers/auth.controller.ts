import type { GetAuthenticatedUserUseCase } from '../../app/usecases/get-authenticated-user.usecase';
import type { LoginUseCase } from '../../app/usecases/login.usecase';
import type { LogoutAllUseCase } from '../../app/usecases/logout-all.usecase';
import type { LogoutUseCase } from '../../app/usecases/logout.usecase';
import { getAuthenticatedUser } from '../get-authenticated-user';
import type { RefreshUseCase } from '../../app/usecases/refresh.usecase';
import { LoginDto } from '../dtos/login.dto';
import { presentUser } from '../../../profile/user/presentation/presenters/user.presenter';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { UserNotFound } from '../../../profile/user/domain/errors/user-not-found.error';

import { presentMessage } from '../../../core/http/message.presenter';
import { validateBody } from '../../../core/http/validate-body';
import { presentAuthTokens, presentLogin } from '../presenters/auth.presenter';
import type { Request, Response } from 'express';

export const createLoginController = (loginUseCase: LoginUseCase) => async (req: Request, res: Response) => {
    const credentials = await validateBody(LoginDto, req.body);
    const result = await loginUseCase(credentials);
    return res.status(200).json(presentLogin(result));
};

export const createGetMeController = (getUser: GetAuthenticatedUserUseCase) => {
    return async (req: Request, res: Response) => {
        const { id } = getAuthenticatedUser(req);
        const user = await getUser(id);
        if (!user) {
            throw new UserNotFound();
        }

        return res.status(200).json(presentUser(user));
    };
};

export const createRefreshController = (refreshUseCase: RefreshUseCase) => async (req: Request, res: Response) => {
    const data = await validateBody(RefreshTokenDto, req.body);

    const result = await refreshUseCase(data.refreshToken);
    return res.status(200).json(presentAuthTokens(result));
};

export const createLogoutController = (logout: LogoutUseCase) => async (req: Request, res: Response) => {
    const data = await validateBody(RefreshTokenDto, req.body);

    await logout(data.refreshToken);

    return res.status(200).json(presentMessage('Déconnexion réussie.'));
};

export const createLogoutAllController = (logoutAll: LogoutAllUseCase) => async (req: Request, res: Response) => {
    const { id } = getAuthenticatedUser(req);
    await logoutAll(id);
    return res.status(200).json(presentMessage('Déconnexion de tous les appareils réussie.'));
};
