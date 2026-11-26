import { IsNull, Not, Or, QueryFailedError } from 'typeorm';
import type { SelectQueryBuilder } from 'typeorm';
import { db } from '../../../../../core/dataBase.config';
import { ReservationEntity } from '../../../../../reservation/infra/persistance/entities/reservation.entity';
import type { EvenementGateway } from '../../../app/interfaces/evenement.gateway';
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

        const isOwner = evenement.creatorId === userId;
        const canUpdate = scope === 'any' || (scope === 'own' ? isOwner : !isOwner);

        return canUpdate ? 'unchanged' : 'forbidden';
    },
    existsById(evenementId) {
        return db.getRepository(EvenementEntity).existsBy({ id: evenementId });
    }
};
