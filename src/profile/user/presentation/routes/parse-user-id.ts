import { InvalidUserIdError } from '../../domain/errors/invalid-user-id.error';

export const parseUserId = (value: string): number => {
    const id = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id <= 0) {
        throw new InvalidUserIdError();
    }

    return id;
};
