import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { UserAccountStatusAction } from '../../../domain/user-account-status';

@Entity('user_account_status_changes')
export class UserAccountStatusChangeEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('int')
    actorId!: number;

    @Column('int')
    userId!: number;

    @Column('varchar', { length: 16 })
    action!: UserAccountStatusAction;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;
}
