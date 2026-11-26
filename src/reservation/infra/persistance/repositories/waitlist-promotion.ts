import { In } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { getRegistrationClosureReason, getRemainingPlaces } from '../../../../profile/evenement/domain/evenement-registration';
import type { Evenement } from '../../../../profile/evenement/domain/evenement';
import type { WaitlistPromotedEvent } from '../../../domain/events/waitlist-promoted.event';
import { ReservationEntity } from '../entities/reservation.entity';
import { WaitlistEntryEntity } from '../entities/waitlist-entry.entity';

type WaitlistEvent = Pick<Evenement, 'id' | 'date' | 'description' | 'cancelledAt' | 'capacity'>;

// The caller holds the event's write lock until these reservations and queue changes commit.
export const promoteWaitlistForLockedEvent = async (
    manager: EntityManager,
    event: WaitlistEvent,
    occupiedPlaces?: number
): Promise<WaitlistPromotedEvent | null> => {
    if (getRegistrationClosureReason(event, new Date())) {
        return null;
    }

    const evenementId = event.id;
    const reservations = manager.getRepository(ReservationEntity);
    const bookedPlaces = occupiedPlaces ?? await reservations.countBy({ evenementId });
    const availablePlaces = getRemainingPlaces(event.capacity, bookedPlaces);
    if (availablePlaces === 0) {
        return null;
    }

    const entries = manager.getRepository(WaitlistEntryEntity);
    const next = await entries.createQueryBuilder('entry')
        .innerJoin('entry.user', 'participant')
        .select('entry.id', 'id')
        .addSelect('entry.userId', 'userId')
        .addSelect('participant.email', 'email')
        .where('entry.evenementId = :evenementId', { evenementId })
        .andWhere('participant.suspendedAt IS NULL')
        .orderBy('entry.sortOrder', 'ASC')
        .limit(availablePlaces)
        .setLock('pessimistic_write')
        .getRawMany<{ id: number; userId: number; email: string }>();
    if (next.length === 0) {
        return null;
    }

    await reservations.insert(next.map(({ userId }) => ({ evenementId, userId })));
    await entries.delete({ evenementId, id: In(next.map(({ id }) => id)) });

    return { evenementId, description: event.description, date: event.date, participantEmails: next.map(({ email }) => email) };
};
