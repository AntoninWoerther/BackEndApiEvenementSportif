import type { RefreshTokenGateway } from '../interfaces/refresh-token.gateway';

export type LogoutAllUseCase = (userId: number) => Promise<void>;

export const createLogoutAllUseCase = (gateway: Pick<RefreshTokenGateway, 'revokeAllForUser'>): LogoutAllUseCase => {
    return userId => gateway.revokeAllForUser(userId);
};
