import { generateRefreshToken, hashRefreshToken } from '../../infra/security/refresh-token.security';
import type { RefreshTokenGateway, RefreshTokenToSave } from '../interfaces/refresh-token.gateway';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const prepareRefreshToken = (userId: number, sessionId: string) => {
    const refreshToken = generateRefreshToken();
    const tokenToSave: RefreshTokenToSave = {
        hashedToken: hashRefreshToken(refreshToken),
        userId,
        sessionId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    };

    return { refreshToken, tokenToSave };
};

export type IssueRefreshTokenUseCase = (userId: number, sessionId: string) => Promise<string>;

export const createIssueRefreshTokenUseCase = (gateway: Pick<RefreshTokenGateway, 'startSession'>): IssueRefreshTokenUseCase => {
    return async (userId, sessionId) => {
        const { refreshToken, tokenToSave } = prepareRefreshToken(userId, sessionId);
        await gateway.startSession(tokenToSave);

        return refreshToken;
    };
};
