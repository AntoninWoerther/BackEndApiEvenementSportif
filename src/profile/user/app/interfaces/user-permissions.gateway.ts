import type { UserPermissionChange } from '../../domain/permissions/user-permission-change';
import type { GrantableUserPermission } from '../../domain/permissions/user.permissions';

export type UserPermissionAction = 'grant' | 'revoke';

export type ChangeUserPermissionResult =
    | { status: 'applied'; permissions: number }
    | { status: 'forbidden' }
    | { status: 'actor-not-found' }
    | { status: 'user-not-found' };

export interface UserPermissionsGateway {
    findPermissionsByUserId(userId: number): Promise<number | null>;
    listPermissionChanges(): Promise<UserPermissionChange[]>;
    changePermission(
        actorId: number,
        userId: number,
        permission: GrantableUserPermission,
        action: UserPermissionAction
    ): Promise<ChangeUserPermissionResult>;
}
