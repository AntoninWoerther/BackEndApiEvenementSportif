import { plainToInstance } from 'class-transformer';
import type { ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationFailedError } from '../errors/validation-failed.error';

export const validateBody = async <T extends object>(dto: ClassConstructor<T>, body: unknown): Promise<T> => {
    const input = plainToInstance(dto, body ?? {});
    const errors = await validate(input, {
        whitelist: true,
        forbidNonWhitelisted: true
    });

    if (errors.length > 0) {
        throw new ValidationFailedError(errors);
    }

    return input;
};
