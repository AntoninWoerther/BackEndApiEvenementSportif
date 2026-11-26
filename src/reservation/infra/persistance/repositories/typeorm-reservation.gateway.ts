import { QueryFailedError } from 'typeorm';
import { db } from '../../../../core/dataBase.config';
import { formatParisDay } from '../../../../core/date/paris-day';
import { EvenementEntity } from '../../../../profile/evenement/infra/persistance/entities/evenement.entity';
import type { CreateReservationResult, ReservationGateway } from '../../../app/interfaces/reservation.gateway';
import type { EventParticipant } from '../../../domain/event-participant';
import { ReservationEntity } from '../entities/reservation.entity';

export const typeormReservationGateway: ReservationGateway = {
    listByUserId(userId) {
        return db.getRepository(ReservationEntity).find({
            where: { userId },
            relations: { evenement: true },
            select: {
                id: true,
                evenementId: true,
                userId: true,
                createdAt: true,
                evenement: {
                    id: true,
                    description: true,
                    location: true,
                    date: true,
                    capacity: true,
                    creatorId: true
                }
            },
            order: { evenement: { date: 'ASC' }, id: 'ASC' }
        });
    },
    async create({ evenementId, userId }) {
        try {
            return await db.transaction<CreateReservationResult>('READ COMMITTED', async (manager) => {
                const evenement = await manager.getRepository(EvenementEntity).findOne({
                    where: { id: evenementId },
                    select: { id: true, capacity: true, date: true },
                    lock: { mode: 'pessimistic_write' }
                });

                if (!evenement) {
                    return { status: 'evenement-not-found' };
                }

                if (evenement.date < formatParisDay(new Date())) {
                    return { status: 'evenement-past' };
                }

                const reservations = manager.getRepository(ReservationEntity);
                if (await reservations.existsBy({ evenementId, userId })) {
                    return { status: 'already-registered' };
                }

                if (await reservations.countBy({ evenementId }) >= evenement.capacity) {
                    return { status: 'evenement-full' };
                }

                const reservation = await reservations.save(reservations.create({ evenementId, userId }));
                return { status: 'created', reservation };
            });
        } catch (error) {
            if (error instanceof QueryFailedError && 'code' in error.driverError) {
                if (error.driverError.code === 'ER_DUP_ENTRY') {
                    return { status: 'already-registered' };
                }

                // The locked event still exists at insertion, so this refers to the user.
                if (error.driverError.code === 'ER_NO_REFERENCED_ROW_2') {
                    return { status: 'user-not-found' };
                }
            }

            throw error;
        }
    },
    async cancel({ evenementId, userId }) {
        const result = await db.getRepository(ReservationEntity).delete({ evenementId, userId });
        if (result.affected === 1) {
            return 'cancelled';
        }

        const evenementExists = await db.getRepository(EvenementEntity).existsBy({ id: evenementId });
        return evenementExists ? 'reservation-not-found' : 'evenement-not-found';
    },
    findEvenementOwner(evenementId) {
        return db.getRepository(EvenementEntity).findOne({
            where: { id: evenementId },
            select: { creatorId: true }
        });
    },
    listEventParticipants(evenementId) {
        return db.getRepository(ReservationEntity)
            .createQueryBuilder('reservation')
            .innerJoin('reservation.user', 'participant')
            .select('reservation.userId', 'userId')
            .addSelect('participant.name', 'name')
            .addSelect('participant.firstname', 'firstname')
            .where('reservation.evenementId = :evenementId', { evenementId })
            .orderBy('reservation.id', 'ASC')
            .getRawMany<EventParticipant>();
    },
    async findParticipantEmails(evenementId) {
        const participants = await db.getRepository(ReservationEntity)
            .createQueryBuilder('reservation')
            .innerJoin('reservation.user', 'participant')
            .select('participant.email', 'email')
            .where('reservation.evenementId = :evenementId', { evenementId })
            .getRawMany<{ email: string }>();

        return participants.map(({ email }) => email);
    }
};
