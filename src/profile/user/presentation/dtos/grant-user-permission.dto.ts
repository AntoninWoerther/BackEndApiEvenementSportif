import { IsIn } from 'class-validator';
import { GRANTABLE_USER_PERMISSIONS } from '../../domain/permissions/user.permissions';

export class GrantUserPermissionDto {
    @IsIn(GRANTABLE_USER_PERMISSIONS, {
        message: `Choisissez un seul droit parmi ${GRANTABLE_USER_PERMISSIONS.join(', ')}.`
    })
    permissions!: number;
}
