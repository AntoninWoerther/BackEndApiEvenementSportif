import { Exclude, Expose, plainToInstance } from 'class-transformer';
import type { UserPermissionChange } from '../../domain/permissions/user-permission-change';
import type { UserProfile } from '../../domain/user-profile';

@Exclude()
export class UserPresenter {

    @Expose()
    id!: number;

    @Expose()
    name!: string;

    @Expose()
    firstname!: string;

    constructor(user: UserProfile) {
        Object.assign(this, user);
    }
}

export const presentUser = (user: UserProfile): UserPresenter => {
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
