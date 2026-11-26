import { verifyPassword } from '../../../../auth/infra/security/password.security';
import { IncorrectCurrentPasswordError } from '../../domain/errors/incorrect-current-password.error';
import { PasswordUpdateConflictError } from '../../domain/errors/password-update-conflict.error';
import { UserNotFound } from '../../domain/errors/user-not-found.error';
import { hashPassword } from '../../infra/security/password.security';
import type { ChangePasswordInput } from '../inputs/change-password.input';
import type { UserPasswordGateway } from '../interfaces/user-password.gateway';

export type ChangePasswordUseCase = (userId: number, input: ChangePasswordInput) => Promise<void>;

export const createChangePasswordUseCase = (gateway: UserPasswordGateway): ChangePasswordUseCase => {
    return async (userId, input) => {
        const currentHash = await gateway.findHashByUserId(userId);
        if (currentHash === null) {
            throw new UserNotFound();
        }

        if (!(await verifyPassword(input.oldPassword, currentHash))) {
            throw new IncorrectCurrentPasswordError();
        }

        const newHash = await hashPassword(input.newPassword);
        const updated = await gateway.updateHashIfUnchanged(userId, currentHash, newHash);
        if (!updated) {
            throw new PasswordUpdateConflictError();
        }
    };
};
