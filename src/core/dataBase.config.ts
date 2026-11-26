import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { EvenementEntity } from '../profile/evenement/infra/persistance/entities/evenement.entity';
import { UserEntity } from '../profile/user/infra/persistance/entities/user.entity';
import { UserPermissionChangeEntity } from '../profile/user/infra/persistance/entities/user-permission-change.entity';
import { UserAccountStatusChangeEntity } from '../profile/user/infra/persistance/entities/user-account-status-change.entity';
import { RefreshTokenEntity } from '../auth/infra/persistance/entities/refresh-token.entity';
import { AuthSessionEventEntity } from '../auth/infra/persistance/entities/auth-session-event.entity';
import { ReservationEntity } from '../reservation/infra/persistance/entities/reservation.entity';

const port = Number(process.env.DB_PORT ?? 3306);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT doit être un entier compris entre 1 et 65535.');
}

export const db = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port,
    username: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'evenementsportif',

    entities: [
        UserEntity,
        UserPermissionChangeEntity,
        UserAccountStatusChangeEntity,
        RefreshTokenEntity,
        AuthSessionEventEntity,
        EvenementEntity,
        ReservationEntity
    ],

    synchronize: true,
})