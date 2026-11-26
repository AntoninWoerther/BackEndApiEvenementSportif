import { generateRefreshToken, hashRefreshToken } from '../../infra/security/refresh-token.security';
import type { RefreshTokenGateway } from '../interfaces/refresh-token.gateway';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type IssueRefreshTokenUseCase = (userId: number) => Promise<string>;

export const createIssueRefreshTokenUseCase = (gateway: RefreshTokenGateway): IssueRefreshTokenUseCase => {
    return async (userId) => {
        const refreshToken = generateRefreshToken();

        await gateway.save({
            hashedToken: hashRefreshToken(refreshToken),
            userId,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
        });

        return refreshToken;
    };
};
