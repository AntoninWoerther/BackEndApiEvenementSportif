import { Exclude, Expose, plainToInstance } from 'class-transformer';
import type { UserPermissionChange } from '../../domain/permissions/user-permission-change';
import type { UserEntity } from '../../infra/persistance/entities/user.entity';

@Exclude()
export class UserPresenter {

    @Expose()
    id!: number;

    @Expose()
    name!: string;

    @Expose()
    firstname!: string;

    constructor(user: UserEntity) {
        Object.assign(this, user);
    }
}

export const presentUser = (user: UserEntity): UserPresenter => {
    return plainToInstance(UserPresenter, user, {
        excludeExtraneousValues: true
    });
};

export const presentUserPermissions = (userId: number, permissions: number) => {
    return { userId, permissions };
};

export const presentUserAccountStatus = (userId: number, suspended: boolean) => {
    return { userId, suspended };
};

export const presentUserPermissionChange = ({
    id, actorId, userId, previousPermissions, newPermissions, createdAt
}: UserPermissionChange): UserPermissionChange => {
    return { id, actorId, userId, previousPermissions, newPermissions, createdAt };
};
