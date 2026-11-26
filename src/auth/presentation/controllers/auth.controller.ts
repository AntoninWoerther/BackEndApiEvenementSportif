import { getAuthenticatedUserUseCase } from '../../app/usecases/get-authenticated-user.usecase';
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
import { ValidationFailedError } from '../../../core/errors/validation-failed.error';

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
    return res.status(200).json({
        user: presentUser(result.user),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
    });
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: 'Utilisateur non authentifié.'
            });
        }

        const user = await getAuthenticatedUserUseCase(userId);

        if (!user) {
            return res.status(404).json({
                message: 'Utilisateur introuvable.'
            });
        }

        return res.status(200).json(presentUser(user));

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Erreur lors de la récupération du profil.'
        });
    }
};

export const createRefreshController = (refreshUseCase: RefreshUseCase) => async (req: Request, res: Response) => {
    try {
        // 1. Vérifier les données reçues
        const data = plainToInstance(RefreshTokenDto, req.body);

        const errors = await validate(data, {
            whitelist: true,
            forbidNonWhitelisted: true
        });

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Données invalides.',
                errors
            });
        }

        // 2. Renouveler les tokens
        const result = await refreshUseCase(data.refreshToken);

        return res.status(200).json(result);

    } catch (error) {
        console.error(error);

        return res.status(401).json({
            message: 'Refresh Token invalide, expiré ou révoqué.'
        });
    }
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

    return res.status(200).json({ message: 'Déconnexion réussie.' });
};

export const createLogoutAllController = (logoutAll: LogoutAllUseCase) => async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (userId === undefined) {
        throw new InvalidTokenError();
    }

    await logoutAll(userId);
    return res.status(200).json({ message: 'Déconnexion de tous les appareils réussie.' });
};
