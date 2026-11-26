import { Router } from 'express';
import type { RequestHandler } from 'express';
import { authMiddleware } from '../../../../auth/infra/gards/auth.middleware';
import { requireUserPermission } from '../../../../auth/infra/gards/user-permissions.middleware';
import type { ChangePasswordUseCase } from '../../app/usecases/change-password.usecase';
import type { ChangeUserPermissionUseCase } from '../../app/usecases/change-user-permission.usecase';
import type { ExportUserPermissionChangesUseCase } from '../../app/usecases/export-user-permission-changes.usecase';
import { USER_PERMISSIONS } from '../../domain/permissions/user.permissions';
import * as userController from '../controllers/user.controller';

interface UserRouteDependencies {
    changePassword: ChangePasswordUseCase;
    grantUserPermission: ChangeUserPermissionUseCase;
    revokeUserPermission: ChangeUserPermissionUseCase;
    exportUserPermissionChanges: ExportUserPermissionChangesUseCase;
    loadUserPermissions: RequestHandler;
}

export const createUserRouter = ({
    changePassword,
    grantUserPermission,
    revokeUserPermission,
    exportUserPermissionChanges,
    loadUserPermissions
}: UserRouteDependencies) => {
    const router = Router();
    const managePermissions = [
        authMiddleware,
        loadUserPermissions,
        requireUserPermission(USER_PERMISSIONS.SUPERUSER)
    ];

    router.get('/', userController.getUsers);
    router.post('/', userController.setUsers);
    router.delete('/:id', authMiddleware, loadUserPermissions, userController.delUser);
    router.get('/:id', userController.getUserById);
    router.patch(
        '/me/password',
        authMiddleware,
        loadUserPermissions,
        requireUserPermission(USER_PERMISSIONS.UPDATE_ACCOUNT),
        userController.createChangePasswordController(changePassword)
    );
    router.patch(
        '/users/:id/permissions',
        ...managePermissions,
        userController.createGrantUserPermissionController(grantUserPermission)
    );
    router.delete(
        '/users/:id/permissions/:permission',
        ...managePermissions,
        userController.createRevokeUserPermissionController(revokeUserPermission)
    );

    router.get(
        '/users/permissions/audit/export',
        ...managePermissions,
        userController.createExportUserPermissionChangesController(exportUserPermissionChanges)
    );

    return router;
};
