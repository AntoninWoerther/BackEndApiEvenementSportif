import { QueryFailedError, Raw } from 'typeorm';
import { InsufficientPermissionsError } from '../../../../../auth/domain/errors/insufficient-permissions.error';
import { db } from '../../../../../core/dataBase.config';
import type { UserGateway } from '../../../app/interfaces/user.gateway';
import { UserEmailAlreadyExists } from '../../../domain/errors/user-email-already-exists.error';
import { isSuperuser, USER_PERMISSIONS } from '../../../domain/permissions/user.permissions';
import { UserEntity } from '../entities/user.entity';

const profileFields = { id: true, name: true, firstname: true } as const;

export const typeormUserGateway: UserGateway = {
    async create(input) {
        const repository = db.getRepository(UserEntity);
        try {
            return await repository.save(repository.create(input));
        } catch (error) {
            if (
                error instanceof QueryFailedError &&
                'code' in error.driverError &&
                error.driverError.code === 'ER_DUP_ENTRY'
            ) {
                throw new UserEmailAlreadyExists();
            }

            throw error;
        }
    },
    list() {
        return db.getRepository(UserEntity).find({ select: profileFields });
    },
    findById(id) {
        return db.getRepository(UserEntity).findOne({ where: { id }, select: profileFields });
    },
    findByEmail(email) {
        return db.getRepository(UserEntity).findOne({
            where: { email },
            select: { ...profileFields, email: true, hashedPassword: true, suspendedAt: true }
        });
    },
    async deleteById(id) {
        const repository = db.getRepository(UserEntity);
        const user = await repository.findOne({ where: { id }, select: { email: true, permissions: true } });
        if (!user) {
            return null;
        }
        if (isSuperuser(user.permissions)) {
            throw new InsufficientPermissionsError('Un compte super utilisateur est protégé contre la suppression via l’API.');
        }

        const result = await repository.delete({
            id,
            permissions: Raw(alias => `(${alias} & :superuserPermission) = 0`, {
                superuserPermission: USER_PERMISSIONS.SUPERUSER
            })
        });
        return result.affected === 1 ? user.email : null;
    }
};
