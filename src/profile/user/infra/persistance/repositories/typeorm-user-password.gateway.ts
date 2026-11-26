import type { UserPasswordGateway } from '../../../app/interfaces/user-password.gateway';
import { findUserById, updateUserPasswordHash } from './user.repository';

export const typeormUserPasswordGateway: UserPasswordGateway = {
    async findHashByUserId(userId) {
        const user = await findUserById(userId);
        return user?.hashedPassword ?? null;
    },
    updateHashIfUnchanged: updateUserPasswordHash
};
