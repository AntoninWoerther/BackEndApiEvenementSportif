import { db } from '../../../../../core/dataBase.config';
import type { UserPasswordGateway } from '../../../app/interfaces/user-password.gateway';
import { UserEntity } from '../entities/user.entity';

export const typeormUserPasswordGateway: UserPasswordGateway = {
    async findHashByUserId(userId) {
        const user = await db.getRepository(UserEntity).findOne({
            where: { id: userId },
            select: { id: true, hashedPassword: true }
        });
        return user?.hashedPassword ?? null;
    },
    async updateHashIfUnchanged(userId, currentHash, newHash) {
        const result = await db.getRepository(UserEntity).update(
            { id: userId, hashedPassword: currentHash },
            { hashedPassword: newHash }
        );
        return result.affected === 1;
    }
};
