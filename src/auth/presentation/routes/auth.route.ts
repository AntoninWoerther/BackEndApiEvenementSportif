import Router from 'express';
import type { LoginUseCase } from '../../app/usecases/login.usecase';
import type { RefreshUseCase } from '../../app/usecases/refresh.usecase';
import { authMiddleware } from '../../infra/gards/auth.middleware';
import { createLoginController, createRefreshController, getMe } from '../controllers/auth.controller';

export const createAuthRouter = ({ login, refresh }: { login: LoginUseCase; refresh: RefreshUseCase }) => {
    const router = Router();

    router.post('/login', createLoginController(login));
    router.get('/me', authMiddleware, getMe);
    router.post('/refresh', createRefreshController(refresh));

    return router;
};
