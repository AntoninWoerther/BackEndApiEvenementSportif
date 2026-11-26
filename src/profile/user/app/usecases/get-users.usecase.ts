import type { UserEntity } from '../../infra/persistance/entities/user.entity';
import { findAllUsers } from '../../infra/persistance/repositories/user.repository';

export const getUsersUseCase = async (): Promise<UserEntity[]> => {
    return findAllUsers();
};
