import type { Request, Response, NextFunction } from 'express';
import { InvalidTokenError } from '../../domain/errors/invalid-token.error';
import { verifyAccessToken } from '../security/access-token.security';

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Token manquant.'
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return next(new InvalidTokenError());
    }

    try {
        const decoded = verifyAccessToken(token);

        if (typeof decoded === 'string' || !decoded.sub) {
            return res.status(401).json({
                message: 'Token invalide.'
            });
        }

        req.user = { id: Number(decoded.sub) };
    } catch {
        return next(new InvalidTokenError());
    }

    next();
};
