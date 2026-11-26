import type { UserPermissionChange } from '../../domain/permissions/user-permission-change';
import type { UserPermissionsGateway } from '../interfaces/user-permissions.gateway';

export type ExportUserPermissionChangesUseCase = () => Promise<UserPermissionChange[]>;

export const makeExportUserPermissionChangesUseCase = (
    gateway: Pick<UserPermissionsGateway, 'listPermissionChanges'>
): ExportUserPermissionChangesUseCase => {
    return () => gateway.listPermissionChanges();
};
