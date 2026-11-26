import { randomUUID } from 'node:crypto';
import type { TokenSecurityGateway } from '../../app/interfaces/token-security.gateway';
import { getJwtSecret, signAccessToken } from './access-token.security';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.security';

export const nodeTokenSecurityGateway: TokenSecurityGateway = {
    createSessionId: randomUUID,
    signAccessToken: (userId, sessionId) => signAccessToken(userId, getJwtSecret(), sessionId),
    generateRefreshToken,
    hashRefreshToken
};
