import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { AuthSessionEventType } from '../../../domain/events/auth-session.events';

@Entity('auth_session_events')
export class AuthSessionEventEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('int')
    userId!: number;

    @Column('varchar', { length: 36, nullable: true })
    sessionId!: string | null;

    @Column('varchar', { length: 16 })
    eventType!: AuthSessionEventType;

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;
}
