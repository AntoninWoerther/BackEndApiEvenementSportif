import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireUserPermission } from '../../../../auth/infra/gards/user-permissions.middleware';
import type { ChangePasswordUseCase } from '../../app/usecases/change-password.usecase';
import type { ChangeUserAccountStatusUseCase } from '../../app/usecases/change-user-account-status.usecase';
import type { ChangeUserPermissionUseCase } from '../../app/usecases/change-user-permission.usecase';
import type { ExportUserPermissionChangesUseCase } from '../../app/usecases/export-user-permission-changes.usecase';
import { USER_PERMISSIONS } from '../../domain/permissions/user.permissions';
import * as userController from '../controllers/user.controller';

interface UserRouteDependencies {
    changePassword: ChangePasswordUseCase;
    grantUserPermission: ChangeUserPermissionUseCase;
    revokeUserPermission: ChangeUserPermissionUseCase;
    exportUserPermissionChanges: ExportUserPermissionChangesUseCase;
    suspendUserAccount: ChangeUserAccountStatusUseCase;
    reactivateUserAccount: ChangeUserAccountStatusUseCase;
    authMiddleware: RequestHandler;
    loadUserPermissions: RequestHandler;
}

export const createUserRouter = ({
    changePassword,
    grantUserPermission,
    revokeUserPermission,
    exportUserPermissionChanges,
    suspendUserAccount,
    reactivateUserAccount,
    authMiddleware,
    loadUserPermissions
}: UserRouteDependencies) => {
    const router = Router();
    const superuserOnly = [
        authMiddleware,
        loadUserPermissions,
        requireUserPermission(USER_PERMISSIONS.SUPERUSER)
    ];

    router.get('/', ...superuserOnly, userController.getUsers);
    router.post('/', userController.setUsers);
    router.delete('/:id', authMiddleware, loadUserPermissions, userController.delUser);
    router.get('/:id', ...superuserOnly, userController.getUserById);
    router.patch(
        '/me/password',
        authMiddleware,
        loadUserPermissions,
        requireUserPermission(USER_PERMISSIONS.UPDATE_ACCOUNT),
        userController.createChangePasswordController(changePassword)
    );
    router.patch(
        '/users/:id/permissions',
        ...superuserOnly,
        userController.createGrantUserPermissionController(grantUserPermission)
    );
    router.delete(
        '/users/:id/permissions/:permission',
        ...superuserOnly,
        userController.createRevokeUserPermissionController(revokeUserPermission)
    );

    router.get(
        '/users/permissions/audit/export',
        ...superuserOnly,
        userController.createExportUserPermissionChangesController(exportUserPermissionChanges)
    );

    router.patch(
        '/users/:id/suspend',
        authMiddleware,
        loadUserPermissions,
        requireUserPermission(USER_PERMISSIONS.SUSPEND_ACCOUNT),
        userController.createChangeUserAccountStatusController(suspendUserAccount)
    );
    router.patch(
        '/users/:id/reactivate',
        authMiddleware,
        loadUserPermissions,
        requireUserPermission(USER_PERMISSIONS.REACTIVATE_ACCOUNT),
        userController.createChangeUserAccountStatusController(reactivateUserAccount)
    );

    return router;
};
