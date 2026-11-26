export interface RefreshTokenToSave {
    hashedToken: string;
    userId: number;
    sessionId: string;
    expiresAt: Date;
}

export interface StoredRefreshToken {
    id: number;
    userId: number;
    sessionId: string | null;
    expiresAt: Date;
    revokedAt: Date | null;
}

export type LogoutResult = 'logged-out' | 'invalid' | 'expired' | 'inactive';

export interface RefreshTokenGateway {
    startSession(token: RefreshTokenToSave): Promise<void>;
    findByHash(hashedToken: string): Promise<StoredRefreshToken | null>;
    rotate(id: number, replacement: RefreshTokenToSave): Promise<boolean>;
    revokeByHash(hashedToken: string): Promise<LogoutResult>;
    revokeAllForUser(userId: number): Promise<void>;
    hasActiveSession(userId: number, sessionId: string): Promise<boolean>;
    deleteExpired(now: Date): Promise<number>;
}
