import { randomUUID } from 'node:crypto';
import { ExpiredRefreshTokenError } from '../../domain/errors/expired-refresh-token.error';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';
import { RevokedRefreshTokenError } from '../../domain/errors/revoked-refresh-token.error';
import { getJwtSecret, signAccessToken } from '../../infra/security/access-token.security';
import { hashRefreshToken } from '../../infra/security/refresh-token.security';
import type { RefreshTokenGateway } from '../interfaces/refresh-token.gateway';
import { prepareRefreshToken } from './create-refresh-token.usecase';

export const createRefreshUseCase = (gateway: RefreshTokenGateway) => {
    return async (refreshToken: string) => {
        const storedToken = await gateway.findByHash(hashRefreshToken(refreshToken));

        if (!storedToken) {
            throw new InvalidRefreshTokenError();
        }

        if (storedToken.revokedAt) {
            throw new RevokedRefreshTokenError();
        }

        if (storedToken.expiresAt.getTime() <= Date.now()) {
            throw new ExpiredRefreshTokenError();
        }

        const sessionId = storedToken.sessionId ?? randomUUID();
        const accessToken = signAccessToken(storedToken.userId, getJwtSecret(), sessionId);
        const { refreshToken: newRefreshToken, tokenToSave } = prepareRefreshToken(storedToken.userId, sessionId);
        if (!(await gateway.rotate(storedToken.id, tokenToSave))) {
            throw new InvalidRefreshTokenError();
        }

        return { accessToken, refreshToken: newRefreshToken };
    };
};

export type RefreshUseCase = ReturnType<typeof createRefreshUseCase>;
