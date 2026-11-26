export interface RefreshTokenToSave {
    hashedToken: string;
    userId: number;
    expiresAt: Date;
}

export interface StoredRefreshToken {
    id: number;
    userId: number;
    expiresAt: Date;
    revokedAt: Date | null;
}

export interface RefreshTokenGateway {
    save(token: RefreshTokenToSave): Promise<void>;
    findByHash(hashedToken: string): Promise<StoredRefreshToken | null>;
    revoke(id: number): Promise<void>;
    deleteExpired(now: Date): Promise<number>;
}
