import type { Request } from 'express';
import { InvalidTokenError } from '../domain/errors/invalid-token.error';

export const getAuthenticatedUser = (req: Pick<Request, 'user'>): NonNullable<Request['user']> => {
    const user = req.user;
    if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) {
        throw new InvalidTokenError();
    }

    return user;
};
