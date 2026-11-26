import { IsNull, Not, Or, QueryFailedError } from 'typeorm';
import type { SelectQueryBuilder } from 'typeorm';
import { db } from '../../../../../core/dataBase.config';
import { ReservationEntity } from '../../../../../reservation/infra/persistance/entities/reservation.entity';
import type { EvenementGateway, UpdateEvenementDetailsResult, UpdateEvenementScope } from '../../../app/interfaces/evenement.gateway';
import type { EvenementWithAvailability } from '../../../domain/evenement';
import { EvenementEntity } from '../entities/evenement.entity';

const buildEvenementAvailabilityQuery = () => {
    return db.getRepository(EvenementEntity).createQueryBuilder('evenement')
        .select([
            'evenement.id',
            'evenement.description',
            'evenement.location',
            'evenement.date',
            'evenement.capacity',
            'evenement.creatorId'
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

    // The subquery counts reservations without adding rows to the event result.
    return entities.map((evenement, index) => ({
        ...evenement,
        remainingPlaces: Math.max(0, evenement.capacity - Number(raw[index].reservationCount))
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
        const result = await db.getRepository(EvenementEntity).delete({ id: evenementId, creatorId });
        return result.affected === 1;
    },
    async updateDate(evenementId, userId, date, scope) {
        const repository = db.getRepository(EvenementEntity);
        const ownerCriteria = {
            own: { creatorId: userId },
            others: { creatorId: Or(Not(userId), IsNull()) },
            any: {}
        }[scope];
        const result = await repository.update(
            { id: evenementId, ...ownerCriteria, date: Not(date) },
            { date, deletionWarningSentAt: null }
        );
        if (result.affected === 1) {
            return 'updated';
        }

        const evenement = await repository.findOne({
            where: { id: evenementId },
            select: { id: true, creatorId: true }
        });
        if (!evenement) {
            return 'evenement-not-found';
        }

        return canUpdateEvenement(scope, evenement.creatorId, userId) ? 'unchanged' : 'forbidden';
    },
    updateDetails(evenementId, userId, input, scope) {
        return db.transaction<UpdateEvenementDetailsResult>('READ COMMITTED', async manager => {
            const events = manager.getRepository(EvenementEntity);
            // Reservation creation takes the same lock before checking capacity.
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

            if (input.capacity !== undefined) {
                const reservations = await manager.getRepository(ReservationEntity).countBy({ evenementId });
                if (input.capacity < reservations) {
                    return { status: 'capacity-too-low' };
                }
            }

            const details = {
                description: input.description ?? evenement.description,
                location: input.location ?? evenement.location,
                capacity: input.capacity ?? evenement.capacity
            };
            await events.update(evenementId, details);
            return { status: 'updated', evenement: { ...evenement, ...details } };
        });
    },
    existsById(evenementId) {
        return db.getRepository(EvenementEntity).existsBy({ id: evenementId });
    }
};
