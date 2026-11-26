import { ExpiredRefreshTokenError } from '../../domain/errors/expired-refresh-token.error';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';
import { RevokedRefreshTokenError } from '../../domain/errors/revoked-refresh-token.error';
import { hashRefreshToken } from '../../infra/security/refresh-token.security';
import type { RefreshTokenGateway } from '../interfaces/refresh-token.gateway';

export type LogoutUseCase = (refreshToken: string) => Promise<void>;

export const createLogoutUseCase = (gateway: Pick<RefreshTokenGateway, 'revokeByHash'>): LogoutUseCase => {
    return async (refreshToken) => {
        const result = await gateway.revokeByHash(hashRefreshToken(refreshToken));

        switch (result) {
            case 'logged-out':
                return;
            case 'invalid':
                throw new InvalidRefreshTokenError();
            case 'expired':
                throw new ExpiredRefreshTokenError();
            case 'inactive':
                throw new RevokedRefreshTokenError();
        }
    };
};
