import { IncorrectCurrentPasswordError } from '../../domain/errors/incorrect-current-password.error';
import { PasswordUpdateConflictError } from '../../domain/errors/password-update-conflict.error';
import { UserNotFound } from '../../domain/errors/user-not-found.error';
import type { ChangePasswordInput } from '../inputs/change-password.input';
import type { PasswordHasherGateway } from '../interfaces/password-hasher.gateway';
import type { UserPasswordGateway } from '../interfaces/user-password.gateway';

export type ChangePasswordUseCase = (userId: number, input: ChangePasswordInput) => Promise<void>;

export const createChangePasswordUseCase = (
    gateway: UserPasswordGateway,
    passwords: PasswordHasherGateway
): ChangePasswordUseCase => {
    return async (userId, input) => {
        const currentHash = await gateway.findHashByUserId(userId);
        if (currentHash === null) {
            throw new UserNotFound();
        }

        if (!(await passwords.verify(input.oldPassword, currentHash))) {
            throw new IncorrectCurrentPasswordError();
        }

        const newHash = await passwords.hash(input.newPassword);
        const updated = await gateway.updateHashIfUnchanged(userId, currentHash, newHash);
        if (!updated) {
            throw new PasswordUpdateConflictError();
        }
    };
};
