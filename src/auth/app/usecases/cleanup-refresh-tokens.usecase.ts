import type { RefreshTokenGateway } from '../interfaces/refresh-token.gateway';

export type CleanupRefreshTokensUseCase = (now?: Date) => Promise<number>;

export const makeCleanupRefreshTokensUseCase = (
    gateway: Pick<RefreshTokenGateway, 'deleteExpired'>
): CleanupRefreshTokensUseCase => {
    return (now = new Date()) => gateway.deleteExpired(now);
};
