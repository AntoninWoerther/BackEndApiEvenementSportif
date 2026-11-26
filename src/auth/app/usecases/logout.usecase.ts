import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';
import type { RefreshTokenGateway } from '../interfaces/refresh-token.gateway';
import type { TokenSecurityGateway } from '../interfaces/token-security.gateway';

export type LogoutUseCase = (refreshToken: string) => Promise<void>;

export const createLogoutUseCase = (
    gateway: Pick<RefreshTokenGateway, 'revokeByHash'>,
    tokens: Pick<TokenSecurityGateway, 'hashRefreshToken'>
): LogoutUseCase => {
    return async (refreshToken) => {
        const result = await gateway.revokeByHash(tokens.hashRefreshToken(refreshToken));

        if (result !== 'logged-out') {
            throw new InvalidRefreshTokenError();
        }
    };
};
