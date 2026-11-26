import { IsNull, Not, Or, QueryFailedError } from 'typeorm';
import type { SelectQueryBuilder } from 'typeorm';
import { db } from '../../../../../core/dataBase.config';
import { ReservationEntity } from '../../../../../reservation/infra/persistance/entities/reservation.entity';
import { promoteWaitlistForLockedEvent } from '../../../../../reservation/infra/persistance/repositories/waitlist-promotion';
import { findReservationParticipantEmails } from '../../../../../reservation/infra/persistance/repositories/typeorm-reservation.gateway';
import type { CancelEvenementResult, EvenementGateway, UpdateEvenementDetailsResult, UpdateEvenementScope } from '../../../app/interfaces/evenement.gateway';
import type { EvenementWithAvailability } from '../../../domain/evenement';
import { getRemainingPlaces } from '../../../domain/evenement-registration';
import { EvenementEntity } from '../entities/evenement.entity';

const buildEvenementAvailabilityQuery = () => {
    return db.getRepository(EvenementEntity).createQueryBuilder('evenement')
        .select([
            'evenement.id',
            'evenement.description',
            'evenement.location',
            'evenement.date',
            'evenement.capacity',
            'evenement.creatorId',
            'evenement.cancelledAt',
            'evenement.cancellationReason'
        ])
        .addSelect(query => query
            .select('COUNT(*)')
            .from(ReservationEntity, 'reservation')
            .where('reservation.evenementId = evenement.id'), 'reservationCount');
};

const readEvenementsWithAvailability = async (
    query: SelectQueryBuilder<EvenementEntity>
): Promise<EvenementWithAvailability[]> => {
    const { entities, raw } = await query.getRawAndEntities<{ reservationCount: number | string }>();

    return entities.map((evenement, index) => ({
        ...evenement,
        remainingPlaces: evenement.cancelledAt ? 0 : getRemainingPlaces(evenement.capacity, Number(raw[index].reservationCount))
    }));
};

const canUpdateEvenement = (scope: UpdateEvenementScope, creatorId: number | null, userId: number): boolean => {
    const isOwner = creatorId === userId;
    return scope === 'any' || (scope === 'own' ? isOwner : !isOwner);
};

export const typeormEvenementGateway: EvenementGateway = {
    listWithAvailability() {
        const query = buildEvenementAvailabilityQuery()
            .orderBy('evenement.date', 'ASC')
            .addOrderBy('evenement.id', 'ASC');

        return readEvenementsWithAvailability(query);
    },
    async findWithAvailabilityById(evenementId) {
        const query = buildEvenementAvailabilityQuery().where('evenement.id = :evenementId', { evenementId });
        const [evenement] = await readEvenementsWithAvailability(query);
        return evenement ?? null;
    },
    async create(input, creatorId) {
        const repository = db.getRepository(EvenementEntity);
        const evenement = repository.create({ ...input, creatorId });

        try {
            return await repository.save(evenement);
        } catch (error) {
            if (
                error instanceof QueryFailedError &&
                'code' in error.driverError &&
                error.driverError.code === 'ER_NO_REFERENCED_ROW_2'
            ) {
                return null;
            }

            throw error;
        }
    },
    async deleteOwnedBy(evenementId, creatorId) {
        const events = db.getRepository(EvenementEntity);
        const result = await events.delete({ id: evenementId, creatorId, cancelledAt: IsNull() });
        if (result.affected === 1) {
            return 'deleted';
        }

        const evenement = await events.findOne({
            where: { id: evenementId },
            select: { id: true, creatorId: true, cancelledAt: true }
        });
        if (!evenement) {
            return 'evenement-not-found';
        }
        if (evenement.creatorId !== creatorId) {
            return 'forbidden';
        }
        return evenement.cancelledAt ? 'already-cancelled' : 'forbidden';
    },
    async updateDate(evenementId, userId, date, scope) {
        const repository = db.getRepository(EvenementEntity);
        const ownerCriteria = {
            own: { creatorId: userId },
            others: { creatorId: Or(Not(userId), IsNull()) },
            any: {}
        }[scope];
        const result = await repository.update(
            { id: evenementId, ...ownerCriteria, date: Not(date), cancelledAt: IsNull() },
            { date, deletionWarningSentAt: null }
        );
        if (result.affected === 1) {
            return 'updated';
        }

        const evenement = await repository.findOne({
            where: { id: evenementId },
            select: { id: true, creatorId: true, cancelledAt: true }
        });
        if (!evenement) {
            return 'evenement-not-found';
        }

        if (!canUpdateEvenement(scope, evenement.creatorId, userId)) {
            return 'forbidden';
        }
        return evenement.cancelledAt ? 'already-cancelled' : 'unchanged';
    },
    updateDetails(evenementId, userId, input, scope) {
        return db.transaction<UpdateEvenementDetailsResult>('READ COMMITTED', async manager => {
            const events = manager.getRepository(EvenementEntity);
            const evenement = await events.findOne({
                where: { id: evenementId },
                lock: { mode: 'pessimistic_write' }
            });
            if (!evenement) {
                return { status: 'evenement-not-found' };
            }
            if (!canUpdateEvenement(scope, evenement.creatorId, userId)) {
                return { status: 'forbidden' };
            }

            if (evenement.cancelledAt) {
                return { status: 'already-cancelled' };
            }

            const occupiedPlaces = input.capacity === undefined
                ? undefined
                : await manager.getRepository(ReservationEntity).countBy({ evenementId });
            if (input.capacity !== undefined && occupiedPlaces !== undefined && input.capacity < occupiedPlaces) {
                return { status: 'capacity-too-low' };
            }

            const details = {
                description: input.description ?? evenement.description,
                location: input.location ?? evenement.location,
                capacity: input.capacity ?? evenement.capacity
            };
            await events.update(evenementId, details);
            const updated = { ...evenement, ...details };
            const promotion = updated.capacity > evenement.capacity
                ? await promoteWaitlistForLockedEvent(manager, updated, occupiedPlaces)
                : null;
            return { status: 'updated', evenement: updated, promotion };
        });
    },
    cancel(evenementId, userId, reason, canCancelOther) {
        return db.transaction<CancelEvenementResult>('READ COMMITTED', async manager => {
            const events = manager.getRepository(EvenementEntity);
            const evenement = await events.findOne({
                where: { id: evenementId },
                lock: { mode: 'pessimistic_write' }
            });
            if (!evenement) {
                return { status: 'evenement-not-found' };
            }
            if (evenement.creatorId !== userId && !canCancelOther) {
                return { status: 'forbidden' };
            }
            if (evenement.cancelledAt) {
                return { status: 'already-cancelled' };
            }

            const cancellation = { cancelledAt: new Date(), cancellationReason: reason };
            const participantEmails = await findReservationParticipantEmails(manager.getRepository(ReservationEntity), evenementId);
            await events.update(evenementId, cancellation);
            return { status: 'cancelled', evenement: { ...evenement, ...cancellation }, participantEmails };
        });
    }
};
