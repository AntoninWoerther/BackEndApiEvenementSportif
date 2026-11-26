import assert from 'node:assert/strict';
import { test } from 'node:test';
import { db } from '../src/core/dataBase.config.ts';
import { EvenementEntity } from '../src/profile/evenement/infra/persistance/entities/evenement.entity.ts';
import { makeCreateReservationUseCase } from '../src/reservation/app/usecases/create-reservation.usecase.ts';
import { ReservationEntity } from '../src/reservation/infra/persistance/entities/reservation.entity.ts';
import { typeormReservationGateway } from '../src/reservation/infra/persistance/repositories/typeorm-reservation.gateway.ts';

const createReservation = makeCreateReservationUseCase(typeormReservationGateway);
const event = { id: 10, capacity: 2 };

function seedEvent(t) {
    const reservations = [{ id: 1, evenementId: event.id, userId: 20 }];
    const repositories = new Map([
        [EvenementEntity, {
            async findOne({ where, lock }) {
                assert.deepEqual(lock, { mode: 'pessimistic_write' });
                return where.id === event.id ? event : null;
            }
        }],
        [ReservationEntity, {
            async existsBy({ evenementId, userId }) {
                return reservations.some(row => row.evenementId === evenementId && row.userId === userId);
            },
            async countBy({ evenementId }) {
                return reservations.filter(row => row.evenementId === evenementId).length;
            },
            create: input => input,
            async save(input) {
                const reservation = { ...input, id: reservations.length + 1 };
                reservations.push(reservation);
                return reservation;
            }
        }]
    ]);

    // Model concurrent transactions waiting for the write lock on the same event.
    let previousTransaction = Promise.resolve();
    t.mock.method(db, 'transaction', (isolation, run) => {
        assert.equal(isolation, 'READ COMMITTED');
        const transaction = previousTransaction.then(() => run({
            getRepository: entity => repositories.get(entity)
        }));
        previousTransaction = transaction.then(() => {}, () => {});
        return transaction;
    });

    return reservations;
}

test('deux demandes simultanées pour la dernière place donnent une seule réservation', async t => {
    const reservations = seedEvent(t);
    const results = await Promise.allSettled([
        createReservation({ evenementId: event.id, userId: 21 }),
        createReservation({ evenementId: event.id, userId: 22 })
    ]);

    const confirmed = results.filter(result => result.status === 'fulfilled');
    const rejected = results.filter(result => result.status === 'rejected');
    assert.equal(confirmed.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].reason.statusCode, 409);
    assert.equal(rejected[0].reason.errorid, 'RESERVATION_002');
    assert.equal(reservations.length, event.capacity);
    assert.deepEqual(reservations[1], confirmed[0].value);
});

test('une deuxième inscription du même utilisateur laisse la dernière place libre', async t => {
    const reservations = seedEvent(t);

    await assert.rejects(createReservation({ evenementId: event.id, userId: 20 }), {
        statusCode: 409,
        errorid: 'RESERVATION_001'
    });
    assert.equal(reservations.length, 1);
});
