import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EvenementEntity } from '../../../../profile/evenement/infra/persistance/entities/evenement.entity';
import { UserEntity } from '../../../../profile/user/infra/persistance/entities/user.entity';
import type { Reservation } from '../../../domain/reservation';

@Entity('reservations')
@Index('UQ_reservation_evenement_user', ['evenementId', 'userId'], { unique: true })
export class ReservationEntity implements Reservation {
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

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;
}
