import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../../../user/infra/persistance/entities/user.entity';
import type { Evenement } from '../../../domain/evenement';

@Entity('evenements')
export class EvenementEntity implements Evenement {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('varchar', { length: 255 })
    description!: string;

    @Column('varchar', { length: 255 })
    location!: string;

    @Index('IDX_evenements_date')
    @Column('date')
    date!: string;

    @Column('int')
    capacity!: number;

    @Column('datetime', { nullable: true })
    deletionWarningSentAt!: Date | null;

    @Column('int', { nullable: true })
    creatorId!: number | null;

    @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'creatorId' })
    creator!: UserEntity | null;
}
