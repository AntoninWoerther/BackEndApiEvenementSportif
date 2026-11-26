import { InvalidEvenementIdError } from '../../domain/errors/invalid-evenement-id.error';

export const parseEvenementId = (value: string): number => {
    const id = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id <= 0) {
        throw new InvalidEvenementIdError();
    }

    return id;
};
