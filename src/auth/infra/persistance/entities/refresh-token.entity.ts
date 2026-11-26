
import {
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from 'typeorm';

import { UserEntity } from '../../../../profile/user/infra/persistance/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column('varchar', { length: 255, unique: true })
    hashedToken!: string;

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity;

    @Index('IDX_refresh_tokens_expires_at')
    @Column('datetime')
    expiresAt!: Date;

    @Column('datetime', { nullable: true })
    revokedAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;
}