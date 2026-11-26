import { QueryFailedError, Raw } from 'typeorm';
import { InsufficientPermissionsError } from '../../../../../auth/domain/errors/insufficient-permissions.error';
import { db } from '../../../../../core/dataBase.config';
import type { WaitlistPromotedEvent } from '../../../../../reservation/domain/events/waitlist-promoted.event';
import { ReservationEntity } from '../../../../../reservation/infra/persistance/entities/reservation.entity';
import { promoteWaitlistForLockedEvent } from '../../../../../reservation/infra/persistance/repositories/waitlist-promotion';
import { EvenementEntity } from '../../../../evenement/infra/persistance/entities/evenement.entity';
import type { DeletedUser, UserGateway } from '../../../app/interfaces/user.gateway';
import { UserEmailAlreadyExists } from '../../../domain/errors/user-email-already-exists.error';
import { isSuperuser, USER_PERMISSIONS } from '../../../domain/permissions/user.permissions';
import { UserEntity } from '../entities/user.entity';

const profileFields = { id: true, name: true, firstname: true } as const;

export const typeormUserGateway: UserGateway = {
    async create(input) {
        const repository = db.getRepository(UserEntity);
        try {
            return await repository.save(repository.create(input));
        } catch (error) {
            if (
                error instanceof QueryFailedError &&
                'code' in error.driverError &&
                error.driverError.code === 'ER_DUP_ENTRY'
            ) {
                throw new UserEmailAlreadyExists();
            }

            throw error;
        }
    },
    list() {
        return db.getRepository(UserEntity).find({ select: profileFields });
    },
    findById(id) {
        return db.getRepository(UserEntity).findOne({ where: { id }, select: profileFields });
    },
    findByEmail(email) {
        return db.getRepository(UserEntity).findOne({
            where: { email },
            select: { ...profileFields, email: true, hashedPassword: true, suspendedAt: true }
        });
    },
    deleteById(id) {
        return db.transaction<DeletedUser | null>('READ COMMITTED', async manager => {
            const users = manager.getRepository(UserEntity);
            const user = await users.findOne({
                where: { id },
                select: { id: true, email: true, permissions: true },
                lock: { mode: 'pessimistic_write' }
            });
            if (!user) {
                return null;
            }
            if (isSuperuser(user.permissions)) {
                throw new InsufficientPermissionsError('Un compte super utilisateur est protégé contre la suppression via l’API.');
            }

            const bookings = await manager.getRepository(ReservationEntity).find({
                where: { userId: id },
                select: { evenementId: true },
                order: { evenementId: 'ASC' }
            });
            const result = await users.delete({
                id,
                permissions: Raw(alias => `(${alias} & :superuserPermission) = 0`, {
                    superuserPermission: USER_PERMISSIONS.SUPERUSER
                })
            });
            if (result.affected !== 1) {
                return null;
            }

            const promotions: WaitlistPromotedEvent[] = [];
            const events = manager.getRepository(EvenementEntity);
            for (const { evenementId } of bookings) {
                const event = await events.findOne({ where: { id: evenementId }, lock: { mode: 'pessimistic_write' } });
                if (!event) {
                    continue;
                }
                const promotion = await promoteWaitlistForLockedEvent(manager, event);
                if (promotion) {
                    promotions.push(promotion);
                }
            }
            return { email: user.email, promotions };
        });
    }
};
