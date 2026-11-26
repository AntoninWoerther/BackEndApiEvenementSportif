import { In, IsNull } from 'typeorm';
import { db } from '../../../../../core/dataBase.config';
import { ReservationEntity } from '../../../../../reservation/infra/persistance/entities/reservation.entity';
import { UserEntity } from '../../../../user/infra/persistance/entities/user.entity';
import type { EvenementReminderGateway } from '../../../app/interfaces/evenement-reminder.gateway';
import type { EvenementReminderEvent } from '../../../domain/events/evenement.events';
import { EvenementEntity } from '../entities/evenement.entity';

const dueRecipientCondition = '(reservation.reminderSentForDate IS NULL OR reservation.reminderSentForDate <> :date)';

export const typeormEvenementReminderGateway: EvenementReminderGateway = {
    async findDueEventIds(date) {
        const events = await db.getRepository(EvenementEntity).createQueryBuilder('evenement')
            .select('evenement.id')
            .where({ date, cancelledAt: IsNull() })
            .andWhere(query => {
                const dueReservations = query.subQuery()
                    .select('1')
                    .from(ReservationEntity, 'reservation')
                    .where('reservation.evenementId = evenement.id')
                    .andWhere(dueRecipientCondition)
                    .getQuery();
                return `EXISTS ${dueReservations}`;
            }, { date })
            .getMany();

        return events.map(event => event.id);
    },
    prepareReminder(evenementId, date) {
        return db.transaction<EvenementReminderEvent | null>('READ COMMITTED', async manager => {
            // Recheck the date and status while holding the same lock as bookings and cancellations.
            const event = await manager.getRepository(EvenementEntity).findOne({
                where: { id: evenementId, date, cancelledAt: IsNull() },
                lock: { mode: 'pessimistic_write' }
            });
            if (!event) {
                return null;
            }

            const reservations = manager.getRepository(ReservationEntity);
            const recipients = await reservations.createQueryBuilder('reservation')
                .innerJoin('reservation.user', 'participant')
                .select('reservation.id', 'id')
                .addSelect('participant.email', 'email')
                .where('reservation.evenementId = :evenementId', { evenementId })
                .andWhere(dueRecipientCondition, { date })
                .setLock('pessimistic_write')
                .getRawMany<{ id: number; email: string }>();
            if (recipients.length === 0) {
                return null;
            }

            const organizer = event.creatorId === null ? null : await manager.getRepository(UserEntity).findOne({
                where: { id: event.creatorId },
                select: { id: true, name: true, firstname: true }
            });
            await reservations.update({ id: In(recipients.map(({ id }) => id)) }, { reminderSentForDate: date });

            return {
                evenementId,
                date,
                location: event.location,
                description: event.description,
                organizerName: organizer ? `${organizer.firstname} ${organizer.name}` : null,
                participantEmails: recipients.map(({ email }) => email)
            };
        });
    }
};
