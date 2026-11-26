import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EvenementEntity } from '../../../../profile/evenement/infra/persistance/entities/evenement.entity';
import { UserEntity } from '../../../../profile/user/infra/persistance/entities/user.entity';

@Entity('event_waitlist_entries')
@Index('UQ_waitlist_evenement_user', ['evenementId', 'userId'], { unique: true })
@Index('IDX_waitlist_evenement_order', ['evenementId', 'sortOrder'])
export class WaitlistEntryEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('int')
    evenementId!: number;

    @ManyToOne(() => EvenementEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'evenementId' })
    evenement!: EvenementEntity;

    @Column('int')
    userId!: number;

    @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity;

    @Column('int')
    sortOrder!: number;
}
