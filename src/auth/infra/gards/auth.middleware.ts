import type { RequestHandler } from 'express';
import type { RefreshTokenGateway } from '../../app/interfaces/refresh-token.gateway';
import { InvalidTokenError } from '../../domain/errors/invalid-token.error';
import { verifyAccessToken } from '../security/access-token.security';

export const makeAuthMiddleware = (gateway: Pick<RefreshTokenGateway, 'hasActiveSession'>): RequestHandler => {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token manquant.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new InvalidTokenError();
        }

        let decoded: ReturnType<typeof verifyAccessToken>;
        try {
            decoded = verifyAccessToken(token);
        } catch {
            throw new InvalidTokenError();
        }

        if (typeof decoded === 'string' || typeof decoded.sid !== 'string' || !decoded.sid) {
            throw new InvalidTokenError();
        }

        const userId = Number(decoded.sub);
        if (!Number.isSafeInteger(userId) || userId <= 0 || !(await gateway.hasActiveSession(userId, decoded.sid))) {
            throw new InvalidTokenError();
        }

        req.user = { id: userId };
        next();
    };
};
