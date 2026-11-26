import assert from 'node:assert/strict';
import { test } from 'node:test';
import { eventEmitter } from '../src/core/bus/event.emiter.ts';
import { db } from '../src/core/dataBase.config.ts';
import { makeUpdateEvenementDetailsUseCase } from '../src/profile/evenement/app/usecases/update-evenement-details.usecase.ts';
import { EvenementEntity } from '../src/profile/evenement/infra/persistance/entities/evenement.entity.ts';
import { typeormEvenementGateway } from '../src/profile/evenement/infra/persistance/repositories/typeorm-evenement.gateway.ts';
import { makeDeleteUserUseCase } from '../src/profile/user/app/usecases/delete-user.usecase.ts';
import { USER_PERMISSIONS } from '../src/profile/user/domain/permissions/user.permissions.ts';
import { UserEntity } from '../src/profile/user/infra/persistance/entities/user.entity.ts';
import { typeormUserGateway } from '../src/profile/user/infra/persistance/repositories/typeorm-user.gateway.ts';
import { makeCancelReservationUseCase } from '../src/reservation/app/usecases/cancel-reservation.usecase.ts';
import { makeCreateReservationUseCase } from '../src/reservation/app/usecases/create-reservation.usecase.ts';
import { makeRemoveEventParticipantUseCase } from '../src/reservation/app/usecases/remove-event-participant.usecase.ts';
import { WAITLIST_PROMOTED } from '../src/reservation/domain/events/waitlist-promoted.event.ts';
import { registerWaitlistPromotionEmailListener } from '../src/reservation/infra/mailer/waitlist-promotion-email.listener.ts';
import { ReservationEntity } from '../src/reservation/infra/persistance/entities/reservation.entity.ts';
import { WaitlistEntryEntity } from '../src/reservation/infra/persistance/entities/waitlist-entry.entity.ts';
import { typeormReservationGateway } from '../src/reservation/infra/persistance/repositories/typeorm-reservation.gateway.ts';

function setup(t) {
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2030-06-02T12:00:00Z') });
    const event = { id: 10, capacity: 1, creatorId: 1, description: 'Match amical', date: '2030-06-04', cancelledAt: null };
    const bookings = [{ evenementId: 10, userId: 20 }];
    const queue = [
        { id: 1, userId: 21, sortOrder: 2, email: 'camille@example.test' },
        { id: 2, userId: 22, sortOrder: 1, email: 'morgan@example.test' },
        { id: 3, userId: 23, sortOrder: 3, email: 'alex@example.test' },
        { id: 4, userId: 24, sortOrder: 4, email: 'sam@example.test' }
    ];
    const suspended = new Set();
    const deleteBooking = userId => {
        const index = bookings.findIndex(row => row.userId === userId);
        if (index === -1) return { affected: 0 };
        bookings.splice(index, 1);
        return { affected: 1 };
    };
    const insert = t.mock.fn(async rows => {
        assert.ok(bookings.length + rows.length <= event.capacity);
        bookings.push(...rows);
    });
    const repositories = new Map([
        [EvenementEntity, {
            async findOne({ where, lock }) {
                assert.deepEqual(lock, { mode: 'pessimistic_write' });
                return where.id === event.id ? { ...event } : null;
            },
            async update(_id, changes) { Object.assign(event, changes); }
        }],
        [ReservationEntity, {
            async delete({ evenementId, userId }) {
                assert.equal(evenementId, event.id);
                return deleteBooking(userId);
            },
            async countBy() { return bookings.length; },
            async existsBy({ userId }) { return bookings.some(booking => booking.userId === userId); },
            async find({ where: { userId } }) { return bookings.filter(booking => booking.userId === userId); },
            insert
        }],
        [WaitlistEntryEntity, {
            createQueryBuilder() {
                let maximum;
                return {
                    innerJoin() { return this; },
                    select() { return this; },
                    addSelect() { return this; },
                    where(_condition, { evenementId }) { assert.equal(evenementId, event.id); return this; },
                    andWhere(condition) { assert.equal(condition, 'participant.suspendedAt IS NULL'); return this; },
                    orderBy(column, direction) { assert.deepEqual([column, direction], ['entry.sortOrder', 'ASC']); return this; },
                    setLock(mode) { assert.equal(mode, 'pessimistic_write'); return this; },
                    limit(value) { maximum = value; return this; },
                    async getRawMany() {
                        return queue.filter(row => !suspended.has(row.userId))
                            .sort((a, b) => a.sortOrder - b.sortOrder).slice(0, maximum);
                    }
                };
            },
            async delete({ id }) {
                for (const entryId of id.value) {
                    queue.splice(queue.findIndex(row => row.id === entryId), 1);
                }
            }
        }],
        [UserEntity, {
            async findOne({ where: { id } }) { return { id, email: 'partant@example.test', permissions: 7 }; },
            async delete({ id }) { deleteBooking(id); return { affected: 1 }; }
        }]
    ]);

    let currentTransaction = Promise.resolve();
    let inTransaction = false;
    t.mock.method(db, 'transaction', (isolation, run) => {
        assert.equal(isolation, 'READ COMMITTED');
        const transaction = currentTransaction.then(async () => {
            const originalBookings = [...bookings];
            const originalQueue = [...queue];
            const originalEvent = { ...event };
            inTransaction = true;
            try {
                return await run({ getRepository: entity => repositories.get(entity) });
            } catch (error) {
                bookings.splice(0, bookings.length, ...originalBookings);
                queue.splice(0, queue.length, ...originalQueue);
                Object.assign(event, originalEvent);
                throw error;
            } finally {
                inTransaction = false;
            }
        });
        currentTransaction = transaction.then(() => {}, () => {});
        return transaction;
    });

    const log = t.mock.method(console, 'log', () => { assert.equal(inTransaction, false); });
    registerWaitlistPromotionEmailListener();
    const listener = eventEmitter.listeners(WAITLIST_PROMOTED).at(-1);
    t.after(() => eventEmitter.off(WAITLIST_PROMOTED, listener));
    return { event, bookings, queue, suspended, insert, log };
}

test('un désistement inscrit le premier de la file même avec une demande concurrente', async t => {
    const { bookings, queue, log } = setup(t);
    const cancel = makeCancelReservationUseCase(typeormReservationGateway);
    const create = makeCreateReservationUseCase(typeormReservationGateway);
    const cancellation = cancel({ evenementId: 10, userId: 20 });
    const outsider = create({ evenementId: 10, userId: 25 });
    await Promise.all([cancellation, assert.rejects(outsider, { errorid: 'RESERVATION_002' })]);

    assert.deepEqual(bookings, [{ evenementId: 10, userId: 22 }]);
    assert.deepEqual(queue.map(row => row.userId), [21, 23, 24]);
    assert.deepEqual(log.mock.calls.map(call => call.arguments[0]), [
        '[MAIL] À morgan@example.test | Une place s’est libérée. Vous avez été inscrit à l’événement Match amical du 2030-06-04.'
    ]);

    await assert.rejects(cancel({ evenementId: 10, userId: 20 }), { errorid: 'RESERVATION_003' });
    assert.equal(log.mock.callCount(), 1);
});

test('une hausse de capacité inscrit les premiers comptes actifs et utilise la description mise à jour', async t => {
    const { bookings, queue, suspended, log } = setup(t);
    suspended.add(21);
    const update = makeUpdateEvenementDetailsUseCase(typeormEvenementGateway);
    await update(10, 1, { capacity: 3, description: 'Tournoi de volley' }, USER_PERMISSIONS.UPDATE_EVENT);

    assert.deepEqual(bookings.map(row => row.userId), [20, 22, 23]);
    assert.deepEqual(queue.map(row => row.userId), [21, 24]);
    assert.deepEqual(log.mock.calls.map(call => call.arguments[0].split(' | ')[0]), [
        '[MAIL] À morgan@example.test', '[MAIL] À alex@example.test'
    ]);
    assert.ok(log.mock.calls.every(call => call.arguments[0].includes('Tournoi de volley du 2030-06-04')));
});

test('un retrait par modération libère aussi une place, sauf pour un événement terminé', async t => {
    const { event, bookings, log } = setup(t);
    const removeParticipant = makeRemoveEventParticipantUseCase(typeormReservationGateway);
    await removeParticipant({ evenementId: 10, userId: 20 });
    assert.deepEqual(bookings.map(row => row.userId), [22]);

    event.date = '2030-06-01';
    await removeParticipant({ evenementId: 10, userId: 22 });
    assert.deepEqual(bookings, []);
    assert.equal(log.mock.callCount(), 1);
});

test('la suppression d’un compte attribue la place libérée par la suppression en cascade', async t => {
    const { bookings, log } = setup(t);
    const deleteUser = makeDeleteUserUseCase(typeormUserGateway);
    await deleteUser(20, { id: 20, permissions: 7 });

    assert.deepEqual(bookings.map(row => row.userId), [22]);
    assert.match(log.mock.calls[0].arguments[0], /morgan@example\.test/);
});

test('un échec de la transaction conserve la réservation et ne déclenche aucun mail', async t => {
    const { bookings, queue, insert, log } = setup(t);
    insert.mock.mockImplementation(async () => { throw new Error('Écriture impossible.'); });
    const cancel = makeCancelReservationUseCase(typeormReservationGateway);
    await assert.rejects(cancel({ evenementId: 10, userId: 20 }), /Écriture impossible/);

    assert.deepEqual(bookings.map(row => row.userId), [20]);
    assert.equal(queue.length, 4);
    assert.equal(log.mock.callCount(), 0);
});
