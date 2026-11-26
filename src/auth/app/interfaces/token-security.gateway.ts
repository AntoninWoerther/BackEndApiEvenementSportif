export interface TokenSecurityGateway {
    createSessionId(): string;
    signAccessToken(userId: number, sessionId: string): string;
    generateRefreshToken(): string;
    hashRefreshToken(token: string): string;
}
