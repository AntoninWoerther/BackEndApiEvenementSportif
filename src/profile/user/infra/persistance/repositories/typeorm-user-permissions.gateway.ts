import { db } from '../../../../../core/dataBase.config';
import type { ChangeUserPermissionResult, UserPermissionsGateway } from '../../../app/interfaces/user-permissions.gateway';
import { isSuperuser } from '../../../domain/permissions/user.permissions';
import { UserPermissionChangeEntity } from '../entities/user-permission-change.entity';
import { UserEntity } from '../entities/user.entity';

export const typeormUserPermissionsGateway: UserPermissionsGateway = {
    async findPermissionsByUserId(userId) {
        const user = await db.getRepository(UserEntity).findOne({
            where: { id: userId },
            select: { id: true, permissions: true }
        });

        return user?.permissions ?? null;
    },
    listPermissionChanges() {
        return db.getRepository(UserPermissionChangeEntity).find({
            select: {
                id: true,
                actorId: true,
                userId: true,
                previousPermissions: true,
                newPermissions: true,
                createdAt: true
            },
            order: { id: 'ASC' }
        });
    },
    changePermission(actorId, userId, permission, action) {
        return db.transaction<ChangeUserPermissionResult>(async (manager) => {
            const users = manager.getRepository(UserEntity);
            const accounts = await users.createQueryBuilder('user')
                .select(['user.id', 'user.permissions'])
                .where('user.id IN (:...ids)', { ids: [actorId, userId] })
                .orderBy('user.id', 'ASC')
                .setLock('pessimistic_write')
                .getMany();

            const actor = accounts.find(account => account.id === actorId);
            if (!actor) {
                return { status: 'actor-not-found' };
            }
            if (!isSuperuser(actor.permissions)) {
                return { status: 'forbidden' };
            }

            const user = accounts.find(account => account.id === userId);
            if (!user) {
                return { status: 'user-not-found' };
            }
            if (isSuperuser(user.permissions)) {
                return { status: 'forbidden' };
            }

            const permissions = (action === 'grant'
                ? user.permissions | permission
                : user.permissions & ~permission) >>> 0;
            if (user.permissions !== permissions) {
                await users.update(userId, { permissions });
                await manager.getRepository(UserPermissionChangeEntity).insert({
                    actorId,
                    userId,
                    previousPermissions: user.permissions,
                    newPermissions: permissions
                });
            }

            return { status: 'applied', permissions };
        });
    }
};
