import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { InvalidTokenError } from '../../domain/errors/invalid-token.error';

export const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('La clé JWT_SECRET est manquante.');
    }

    return secret;
};

export const signAccessToken = (userId: number, secret: string, sessionId: string): string => {
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '5m') as SignOptions['expiresIn'];
    return jwt.sign({ sub: userId, sid: sessionId }, secret, { expiresIn });
};

export const verifyAccessToken = (token: string) => {
    const secret = getJwtSecret();
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new InvalidTokenError();
        }
        throw error;
    }
};
