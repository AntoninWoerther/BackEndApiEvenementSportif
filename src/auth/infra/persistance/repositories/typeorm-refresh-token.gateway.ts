import type { RefreshTokenGateway } from '../../../app/interfaces/refresh-token.gateway';
import {
    createRefreshToken,
    deleteExpiredRefreshTokens,
    findRefreshTokenByHash,
    revokeRefreshToken
} from './refresh-token.repository';

export const typeormRefreshTokenGateway: RefreshTokenGateway = {
    async save(token) {
        await createRefreshToken({
            hashedToken: token.hashedToken,
            user: { id: token.userId },
            expiresAt: token.expiresAt,
            revokedAt: null
        });
    },
    async findByHash(hashedToken) {
        const token = await findRefreshTokenByHash(hashedToken);
        if (!token) {
            return null;
        }

        return {
            id: token.id,
            userId: token.user.id,
            expiresAt: token.expiresAt,
            revokedAt: token.revokedAt
        };
    },
    revoke: revokeRefreshToken,
    deleteExpired: deleteExpiredRefreshTokens
};
