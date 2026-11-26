import { InsufficientPermissionsError } from '../../../../auth/domain/errors/insufficient-permissions.error';
import { InvalidTokenError } from '../../../../auth/domain/errors/invalid-token.error';
import { UserNotFound } from '../../domain/errors/user-not-found.error';
import type { UserAccountStatusAction } from '../../domain/user-account-status';
import type { UserAccountStatusGateway } from '../interfaces/user-account-status.gateway';

export type ChangeUserAccountStatusUseCase = (actorId: number, userId: number) => Promise<boolean>;

export const makeChangeUserAccountStatusUseCase = (
    gateway: UserAccountStatusGateway,
    action: UserAccountStatusAction
): ChangeUserAccountStatusUseCase => {
    return async (actorId, userId) => {
        switch (await gateway.changeStatus(actorId, userId, action)) {
            case 'applied':
                return action === 'SUSPEND';
            case 'forbidden':
                throw new InsufficientPermissionsError();
            case 'actor-not-found':
                throw new InvalidTokenError();
            case 'user-not-found':
                throw new UserNotFound();
        }
    };
};
