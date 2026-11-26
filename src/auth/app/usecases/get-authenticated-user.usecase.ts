import type { UserEntity } from '../../../profile/user/infra/persistance/entities/user.entity';
import { findUserById } from '../../../profile/user/infra/persistance/repositories/user.repository';

export const getAuthenticatedUserUseCase = (userId: number): Promise<UserEntity | null> => {
    return findUserById(userId);
};
