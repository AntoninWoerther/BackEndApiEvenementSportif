import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { UserPermissionChange } from '../../../domain/permissions/user-permission-change';

@Entity('user_permission_changes')
export class UserPermissionChangeEntity implements UserPermissionChange {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('int')
    actorId!: number;

    @Column('int')
    userId!: number;

    @Column('int', { unsigned: true })
    previousPermissions!: number;

    @Column('int', { unsigned: true })
    newPermissions!: number;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;
}
