import { revokeActiveRefreshTokensForUser } from '../../../../../auth/infra/persistance/repositories/refresh-token.repository';
import { db } from '../../../../../core/dataBase.config';
import type { ChangeUserAccountStatusResult, UserAccountStatusGateway } from '../../../app/interfaces/user-account-status.gateway';
import { isSuperuser } from '../../../domain/permissions/user.permissions';
import { UserAccountStatusChangeEntity } from '../entities/user-account-status-change.entity';
import { UserEntity } from '../entities/user.entity';

export const typeormUserAccountStatusGateway: UserAccountStatusGateway = {
    changeStatus(actorId, userId, action) {
        return db.transaction<ChangeUserAccountStatusResult>(async (manager) => {
            const users = manager.getRepository(UserEntity);
            const accounts = await users.createQueryBuilder('user')
                .select(['user.id', 'user.permissions', 'user.suspendedAt'])
                .where('user.id IN (:...ids)', { ids: [actorId, userId] })
                .orderBy('user.id', 'ASC')
                .setLock('pessimistic_write')
                .getMany();

            const actor = accounts.find(account => account.id === actorId);
            if (!actor || actor.suspendedAt) {
                return 'actor-not-found';
            }
            if (!isSuperuser(actor.permissions)) {
                return 'forbidden';
            }

            const user = accounts.find(account => account.id === userId);
            if (!user) {
                return 'user-not-found';
            }
            if (isSuperuser(user.permissions)) {
                return 'forbidden';
            }

            const suspend = action === 'SUSPEND';
            if (suspend === Boolean(user.suspendedAt)) {
                return 'applied';
            }

            const now = new Date();
            await users.update(userId, { suspendedAt: suspend ? now : null });
            if (suspend) {
                await revokeActiveRefreshTokensForUser(manager, userId, now);
            }

            await manager.getRepository(UserAccountStatusChangeEntity).insert({ actorId, userId, action });
            return 'applied';
        });
    }
};
