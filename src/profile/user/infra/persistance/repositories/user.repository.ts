import { QueryFailedError, Raw } from 'typeorm';
import { InsufficientPermissionsError } from '../../../../../auth/domain/errors/insufficient-permissions.error';
import { UserEntity } from '../entities/user.entity';
import { db } from '../../../../../core/dataBase.config';
import { UserEmailAlreadyExists } from '../../../domain/errors/user-email-already-exists.error';
import { isSuperuser, USER_PERMISSIONS } from '../../../domain/permissions/user.permissions';
type NewUserRecord = Pick<UserEntity, 'name' | 'firstname' | 'email' | 'hashedPassword'>;


export const createNewUsers = async (user: NewUserRecord): Promise<UserEntity> => {
    const repository = db.getRepository(UserEntity);
    const newEntity = repository.create(user);

    try {
        return await repository.save(newEntity);
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
};

// Rechercher un utilisateur par email
export const findUserByEmail = (
    email: string
): Promise<UserEntity | null> => {

    const repository = db.getRepository(UserEntity);

    return repository.findOne({
        where: { email }
    });
};

export const findUserById = (
    id: number
): Promise<UserEntity | null> => {

    const repository = db.getRepository(UserEntity);

    return repository.findOne({
        where: { id }
    });
};

export const updateUserPasswordHash = async (
    id: number,
    currentHash: string,
    newHash: string
): Promise<boolean> => {
    const repository = db.getRepository(UserEntity);
    const result = await repository.update(
        { id, hashedPassword: currentHash },
        { hashedPassword: newHash }
    );

    return result.affected === 1;
};

export const findAllUsers = (): Promise<UserEntity[]> => {
    const repository = db.getRepository(UserEntity);

    return repository.find();
};

export const deleteUserById = async (id: number): Promise<string | null> => {
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
};