import { ExpiredRefreshTokenError } from '../../domain/errors/expired-refresh-token.error';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';
import { RevokedRefreshTokenError } from '../../domain/errors/revoked-refresh-token.error';
import type { RefreshTokenGateway } from '../interfaces/refresh-token.gateway';
import type { TokenSecurityGateway } from '../interfaces/token-security.gateway';
import { prepareRefreshToken } from './create-refresh-token.usecase';

export const createRefreshUseCase = (
    gateway: Pick<RefreshTokenGateway, 'findByHash' | 'rotate'>,
    tokens: TokenSecurityGateway
) => {
    return async (refreshToken: string) => {
        const storedToken = await gateway.findByHash(tokens.hashRefreshToken(refreshToken));

        if (!storedToken) {
            throw new InvalidRefreshTokenError();
        }

        if (storedToken.revokedAt) {
            throw new RevokedRefreshTokenError();
        }

        if (storedToken.expiresAt.getTime() <= Date.now()) {
            throw new ExpiredRefreshTokenError();
        }

        const sessionId = storedToken.sessionId ?? tokens.createSessionId();
        const accessToken = tokens.signAccessToken(storedToken.userId, sessionId);
        const { refreshToken: newRefreshToken, tokenToSave } = prepareRefreshToken(tokens, storedToken.userId, sessionId);
        if (!(await gateway.rotate(storedToken.id, tokenToSave))) {
            throw new InvalidRefreshTokenError();
        }

        return { accessToken, refreshToken: newRefreshToken };
    };
};

export type RefreshUseCase = ReturnType<typeof createRefreshUseCase>;
