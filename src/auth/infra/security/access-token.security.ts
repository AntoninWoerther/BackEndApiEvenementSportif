import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

export const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('La clé JWT_SECRET est manquante.');
    }

    return secret;
};

export const signAccessToken = (userId: number, secret: string): string => {
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '5m') as SignOptions['expiresIn'];
    return jwt.sign({ sub: userId }, secret, { expiresIn });
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, getJwtSecret());
};
