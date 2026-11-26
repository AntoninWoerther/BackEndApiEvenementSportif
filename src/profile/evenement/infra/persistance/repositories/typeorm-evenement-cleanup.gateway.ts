import { Between, IsNull, LessThanOrEqual, Not } from 'typeorm';
import { db } from '../../../../../core/dataBase.config';
import type { EvenementCleanupGateway } from '../../../app/interfaces/evenement-cleanup.gateway';
import { EvenementEntity } from '../entities/evenement.entity';

export const typeormEvenementCleanupGateway: EvenementCleanupGateway = {
    async deleteExpired(lastExpiredDate) {
        const result = await db.getRepository(EvenementEntity).delete({ date: LessThanOrEqual(lastExpiredDate) });
        return result.affected ?? 0;
    },
    async findToWarn(firstDate, lastDate) {
        const evenements = await db.getRepository(EvenementEntity).find({
            where: {
                date: Between(firstDate, lastDate),
                creatorId: Not(IsNull()),
                deletionWarningSentAt: IsNull()
            },
            select: { id: true, date: true, creator: { id: true, email: true } },
            relations: { creator: true }
        });

        return evenements.flatMap(({ id, date, creator }) =>
            creator ? [{ id, date, creatorId: creator.id, creatorEmail: creator.email }] : []
        );
    },
    async markWarningSent(evenement, sentAt) {
        const result = await db.getRepository(EvenementEntity).update(
            { id: evenement.id, date: evenement.date, creatorId: evenement.creatorId, deletionWarningSentAt: IsNull() },
            { deletionWarningSentAt: sentAt }
        );

        return result.affected === 1;
    }
};
