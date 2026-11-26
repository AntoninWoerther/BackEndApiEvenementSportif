import type { RefreshTokenGateway } from '../../../app/interfaces/refresh-token.gateway';
import {
    deleteExpiredRefreshTokens,
    findRefreshTokenByHash,
    hasActiveRefreshSession,
    revokeAllRefreshSessions,
    revokeRefreshSessionByHash,
    rotateRefreshToken,
    startRefreshSession
} from './refresh-token.repository';

export const typeormRefreshTokenGateway: RefreshTokenGateway = {
    startSession: startRefreshSession,
    async findByHash(hashedToken) {
        const token = await findRefreshTokenByHash(hashedToken);
        if (!token || token.userId === null) {
            return null;
        }

        return {
            id: token.id,
            userId: token.userId,
            sessionId: token.sessionId,
            expiresAt: token.expiresAt,
            revokedAt: token.revokedAt
        };
    },
    revokeByHash: revokeRefreshSessionByHash,
    revokeAllForUser: revokeAllRefreshSessions,
    hasActiveSession: hasActiveRefreshSession,
    rotate: rotateRefreshToken,
    deleteExpired: deleteExpiredRefreshTokens
};
