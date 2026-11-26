import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DEFAULT_USER_PERMISSIONS } from '../../../domain/permissions/user.permissions';

@Entity("users")
export class UserEntity {

    @PrimaryGeneratedColumn()
    id!: number

    @Column('varchar', { length: 100 })
    name!: string

    @Column('varchar', { length: 100 })
    firstname!: string
    
    @Column('varchar', { length: 100 , unique: true})
    email!: string

    @Column('varchar', { length: 255 })
    hashedPassword!: string;

    @Column('int', { unsigned: true, default: DEFAULT_USER_PERMISSIONS })
    permissions!: number;

    @Column('datetime', { nullable: true })
    suspendedAt!: Date | null;
}
