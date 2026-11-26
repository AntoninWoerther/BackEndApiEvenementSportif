export interface UserPermissionChange {
    id: number;
    actorId: number;
    userId: number;
    previousPermissions: number;
    newPermissions: number;
    createdAt: Date;
}
