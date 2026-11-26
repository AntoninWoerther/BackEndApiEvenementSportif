import { ExpiredRefreshTokenError } from '../../domain/errors/expired-refresh-token.error';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';
import { RevokedRefreshTokenError } from '../../domain/errors/revoked-refresh-token.error';
import { getJwtSecret, signAccessToken } from '../../infra/security/access-token.security';
import { hashRefreshToken } from '../../infra/security/refresh-token.security';
import type { RefreshTokenGateway } from '../interfaces/refresh-token.gateway';
import type { IssueRefreshTokenUseCase } from './create-refresh-token.usecase';

export const createRefreshUseCase = (
    gateway: RefreshTokenGateway,
    issueRefreshToken: IssueRefreshTokenUseCase
) => {
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

        await gateway.revoke(storedToken.id);

        const accessToken = signAccessToken(storedToken.userId, getJwtSecret());
        const newRefreshToken = await issueRefreshToken(storedToken.userId);

        return { accessToken, refreshToken: newRefreshToken };
    };
};

export type RefreshUseCase = ReturnType<typeof createRefreshUseCase>;
