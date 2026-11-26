import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { EvenementEntity } from '../profile/evenement/infra/persistance/entities/evenement.entity';
import { UserEntity } from '../profile/user/infra/persistance/entities/user.entity';
import { UserPermissionChangeEntity } from '../profile/user/infra/persistance/entities/user-permission-change.entity';
import { RefreshTokenEntity } from '../auth/infra/persistance/entities/refresh-token.entity';
import { ReservationEntity } from '../reservation/infra/persistance/entities/reservation.entity';

export const db = new DataSource({
    type: "mysql",
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '',
    database: 'evenementsportif',

    entities: [UserEntity, UserPermissionChangeEntity, RefreshTokenEntity, EvenementEntity, ReservationEntity],

    synchronize: true,
})