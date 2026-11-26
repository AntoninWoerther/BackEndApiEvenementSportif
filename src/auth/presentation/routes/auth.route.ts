import Router from 'express';
import type { RequestHandler } from 'express';
import type { LoginUseCase } from '../../app/usecases/login.usecase';
import type { LogoutAllUseCase } from '../../app/usecases/logout-all.usecase';
import type { LogoutUseCase } from '../../app/usecases/logout.usecase';
import type { RefreshUseCase } from '../../app/usecases/refresh.usecase';
import {
    createLoginController,
    createLogoutAllController,
    createLogoutController,
    createRefreshController,
    getMe
} from '../controllers/auth.controller';

interface AuthRouteDependencies {
    login: LoginUseCase;
    logout: LogoutUseCase;
    logoutAll: LogoutAllUseCase;
    authMiddleware: RequestHandler;
    refresh: RefreshUseCase;
}

export const createAuthRouter = ({ login, logout, logoutAll, refresh, authMiddleware }: AuthRouteDependencies) => {
    const router = Router();

    router.post('/login', createLoginController(login));
    router.get('/me', authMiddleware, getMe);
    router.post('/refresh', createRefreshController(refresh));
    router.post('/logout', createLogoutController(logout));
    router.post('/logout-all', authMiddleware, createLogoutAllController(logoutAll));

    return router;
};
