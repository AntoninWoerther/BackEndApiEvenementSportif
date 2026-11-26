import type { RefreshTokenGateway, RefreshTokenToSave } from '../interfaces/refresh-token.gateway';

import type { TokenSecurityGateway } from '../interfaces/token-security.gateway';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const prepareRefreshToken = (
    tokens: Pick<TokenSecurityGateway, 'generateRefreshToken' | 'hashRefreshToken'>,
    userId: number,
    sessionId: string
) => {
    const refreshToken = tokens.generateRefreshToken();
    const tokenToSave: RefreshTokenToSave = {
        hashedToken: tokens.hashRefreshToken(refreshToken),
        userId,
        sessionId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    };

    return { refreshToken, tokenToSave };
};

export type IssueRefreshTokenUseCase = (userId: number, sessionId: string) => Promise<string>;

export const createIssueRefreshTokenUseCase = (
    gateway: Pick<RefreshTokenGateway, 'startSession'>,
    tokens: Pick<TokenSecurityGateway, 'generateRefreshToken' | 'hashRefreshToken'>
): IssueRefreshTokenUseCase => {
    return async (userId, sessionId) => {
        const { refreshToken, tokenToSave } = prepareRefreshToken(tokens, userId, sessionId);
        await gateway.startSession(tokenToSave);

        return refreshToken;
    };
};
