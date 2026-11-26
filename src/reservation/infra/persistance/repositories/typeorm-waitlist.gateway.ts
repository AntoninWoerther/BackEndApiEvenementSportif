import { LessThan, QueryFailedError } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { db } from '../../../../core/dataBase.config';
import { getRegistrationClosureReason, getRemainingPlaces } from '../../../../profile/evenement/domain/evenement-registration';
import { EvenementEntity } from '../../../../profile/evenement/infra/persistance/entities/evenement.entity';
import type { JoinWaitlistResult, MoveWaitlistEntryUpResult, WaitlistGateway } from '../../../app/interfaces/waitlist.gateway';
import type { WaitlistParticipant } from '../../../domain/waitlist-entry';
import { ReservationEntity } from '../entities/reservation.entity';
import { WaitlistEntryEntity } from '../entities/waitlist-entry.entity';

const findLockedEvent = (manager: EntityManager, id: number) => manager.getRepository(EvenementEntity).findOne({
    where: { id },
    select: { id: true, creatorId: true, capacity: true, date: true, cancelledAt: true },
    lock: { mode: 'pessimistic_write' }
});

export const typeormWaitlistGateway: WaitlistGateway = {
    async join({ evenementId, userId }) {
        try {
            return await db.transaction<JoinWaitlistResult>('READ COMMITTED', async manager => {
                const event = await findLockedEvent(manager, evenementId);
                if (!event) return { status: 'evenement-not-found' };

                const closed = getRegistrationClosureReason(event, new Date());
                if (closed) return { status: closed };

                const reservations = manager.getRepository(ReservationEntity);
                const entries = manager.getRepository(WaitlistEntryEntity);
                if (await reservations.existsBy({ evenementId, userId })) return { status: 'already-registered' };
                if (await entries.existsBy({ evenementId, userId })) return { status: 'already-queued' };
                const occupiedPlaces = await reservations.countBy({ evenementId });
                if (getRemainingPlaces(event.capacity, occupiedPlaces) > 0) return { status: 'place-available' };

                const last = await entries.findOne({ where: { evenementId }, order: { sortOrder: 'DESC' } });
                const entry = await entries.save(entries.create({ evenementId, userId, sortOrder: (last?.sortOrder ?? 0) + 1 }));
                const position = await entries.countBy({ evenementId });
                return { status: 'joined', entry: { id: entry.id, position } };
            });
        } catch (error) {
            if (error instanceof QueryFailedError && 'code' in error.driverError) {
                if (error.driverError.code === 'ER_DUP_ENTRY') return { status: 'already-queued' };
                if (error.driverError.code === 'ER_NO_REFERENCED_ROW_2') return { status: 'user-not-found' };
            }
            throw error;
        }
    },
    leave({ evenementId, userId }) {
        return db.transaction<'left' | 'evenement-not-found' | 'entry-not-found'>('READ COMMITTED', async manager => {
            if (!(await findLockedEvent(manager, evenementId))) return 'evenement-not-found';

            const result = await manager.getRepository(WaitlistEntryEntity).delete({ evenementId, userId });
            return result.affected === 1 ? 'left' : 'entry-not-found';
        });
    },
    async list(evenementId, actorId, canManageOthers) {
        const event = await db.getRepository(EvenementEntity).findOne({
            where: { id: evenementId },
            select: { id: true, creatorId: true }
        });
        if (!event) return { status: 'evenement-not-found' };
        if (event.creatorId !== actorId && !canManageOthers) return { status: 'forbidden' };

        const entries = await db.getRepository(WaitlistEntryEntity).createQueryBuilder('entry')
            .innerJoin('entry.user', 'participant')
            .select('entry.id', 'id')
            .addSelect('participant.name', 'name')
            .addSelect('participant.firstname', 'firstname')
            .where('entry.evenementId = :evenementId', { evenementId })
            .orderBy('entry.sortOrder', 'ASC')
            .getRawMany<Omit<WaitlistParticipant, 'position'>>();

        return { status: 'listed', entries: entries.map((entry, index) => ({ ...entry, position: index + 1 })) };
    },
    moveUp(evenementId, entryId, actorId, canManageOthers) {
        return db.transaction<MoveWaitlistEntryUpResult>('READ COMMITTED', async manager => {
            const event = await findLockedEvent(manager, evenementId);
            if (!event) return { status: 'evenement-not-found' };
            if (event.creatorId !== actorId && !canManageOthers) return { status: 'forbidden' };

            const closed = getRegistrationClosureReason(event, new Date());
            if (closed) return { status: closed };

            const entries = manager.getRepository(WaitlistEntryEntity);
            const lock = { mode: 'pessimistic_write' } as const;
            const entry = await entries.findOne({ where: { id: entryId, evenementId }, lock });
            if (!entry) return { status: 'entry-not-found' };

            const previous = await entries.findOne({
                where: { evenementId, sortOrder: LessThan(entry.sortOrder) },
                order: { sortOrder: 'DESC' },
                lock
            });
            if (!previous) return { status: 'position', entry: { id: entry.id, position: 1 } };

            await entries.update(previous.id, { sortOrder: entry.sortOrder });
            await entries.update(entry.id, { sortOrder: previous.sortOrder });
            const ahead = await entries.countBy({ evenementId, sortOrder: LessThan(previous.sortOrder) });
            return { status: 'position', entry: { id: entry.id, position: ahead + 1 } };
        });
    }
};
