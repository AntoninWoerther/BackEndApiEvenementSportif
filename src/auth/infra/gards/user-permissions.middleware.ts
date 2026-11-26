import type { RequestHandler } from 'express';
import type { UserPermissionsGateway } from '../../../profile/user/app/interfaces/user-permissions.gateway';
import { hasUserPermission } from '../../../profile/user/domain/permissions/user.permissions';
import type { UserPermission } from '../../../profile/user/domain/permissions/user.permissions';
import { InsufficientPermissionsError } from '../../domain/errors/insufficient-permissions.error';
import { InvalidTokenError } from '../../domain/errors/invalid-token.error';

export const makeLoadUserPermissions = (gateway: Pick<UserPermissionsGateway, 'findPermissionsByUserId'>): RequestHandler => {
    return async (req, _res, next) => {
        const user = req.user;
        if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) {
            throw new InvalidTokenError();
        }

        const permissions = await gateway.findPermissionsByUserId(user.id);
        if (permissions === null) {
            throw new InvalidTokenError();
        }

        user.permissions = permissions;
        next();
    };
};

export const requireAnyUserPermission = (...required: UserPermission[]): RequestHandler => {
    return (req, _res, next) => {
        const permissions = req.user?.permissions;
        if (permissions === undefined) {
            throw new InvalidTokenError();
        }

        if (!required.some(permission => hasUserPermission(permissions, permission))) {
            throw new InsufficientPermissionsError();
        }

        next();
    };
};

export const requireUserPermission = (permission: UserPermission): RequestHandler => {
    return requireAnyUserPermission(permission);
};
