import assert from 'node:assert/strict';
import { test } from 'node:test';
import { db } from '../src/core/dataBase.config.ts';
import { EvenementEntity } from '../src/profile/evenement/infra/persistance/entities/evenement.entity.ts';
import { makeCreateReservationUseCase } from '../src/reservation/app/usecases/create-reservation.usecase.ts';
import { makeGetMyReservationsUseCase } from '../src/reservation/app/usecases/get-my-reservations.usecase.ts';
import { ReservationEntity } from '../src/reservation/infra/persistance/entities/reservation.entity.ts';
import { WaitlistEntryEntity } from '../src/reservation/infra/persistance/entities/waitlist-entry.entity.ts';
import { typeormReservationGateway } from '../src/reservation/infra/persistance/repositories/typeorm-reservation.gateway.ts';
import { getMyReservationsController } from '../src/reservation/presentation/controllers/reservation.controller.ts';

const createReservation = makeCreateReservationUseCase(typeormReservationGateway);
const eventId = 10;
const capacity = 2;

function seedEvent(t, date = '2029-06-03', cancelledAt = null, waitlist = []) {
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2029-06-01T22:00:00Z') });
    const event = { id: eventId, capacity, date, cancelledAt };
    const reservations = [{ id: 1, evenementId: eventId, userId: 20 }];
    const repositories = new Map([
        [EvenementEntity, {
            async findOne({ where, select, lock }) {
                assert.equal(select.date, true);
                assert.equal(select.cancelledAt, true);
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
        }],
        [WaitlistEntryEntity, {
            async delete({ evenementId, userId }) {
                const index = waitlist.findIndex(entry => entry.evenementId === evenementId && entry.userId === userId);
                if (index !== -1) waitlist.splice(index, 1);
            }
        }]
    ]);

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
        createReservation({ evenementId: eventId, userId: 21 }),
        createReservation({ evenementId: eventId, userId: 22 })
    ]);

    const confirmed = results.filter(result => result.status === 'fulfilled');
    const rejected = results.filter(result => result.status === 'rejected');
    assert.equal(confirmed.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].reason.errorid, 'RESERVATION_002');
    assert.equal(reservations.length, capacity);
    assert.deepEqual(reservations[1], confirmed[0].value);
});

test('une deuxième inscription du même utilisateur laisse la dernière place libre', async t => {
    const reservations = seedEvent(t);

    await assert.rejects(createReservation({ evenementId: eventId, userId: 20 }), {
        errorid: 'RESERVATION_001'
    });
    assert.equal(reservations.length, 1);
});

test('une réservation confirmée retire uniquement l’entrée en attente du même utilisateur', async t => {
    const otherEntry = { evenementId: eventId, userId: 22 };
    const waitlist = [{ evenementId: eventId, userId: 21 }, otherEntry];
    seedEvent(t, '2029-06-03', null, waitlist);

    await createReservation({ evenementId: eventId, userId: 21 });
    assert.deepEqual(waitlist, [otherEntry]);
});

test('les inscriptions à un événement passé sont closes dès minuit à Paris', async t => {
    const reservations = seedEvent(t, '2029-06-01');

    await assert.rejects(createReservation({ evenementId: eventId, userId: 21 }), {
        errorid: 'RESERVATION_005'
    });
    assert.equal(reservations.length, 1);
});

test('une inscription est encore possible le jour de l’événement à Paris', async t => {
    const reservations = seedEvent(t, '2029-06-02');

    const reservation = await createReservation({ evenementId: eventId, userId: 21 });

    assert.equal(reservations.length, 2);
    assert.deepEqual(reservation, reservations[1]);
});

test('un événement annulé refuse toute nouvelle inscription même si sa date est future', async t => {
    const reservations = seedEvent(t, '2029-06-03', new Date('2029-06-01T20:00:00Z'));

    await assert.rejects(createReservation({ evenementId: eventId, userId: 21 }), {
        errorid: 'EVENEMENT_009'
    });
    assert.equal(reservations.length, 1);
});

test('Mes réservations distingue les événements terminés, du jour, à venir et annulés', async t => {
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2029-06-01T22:00:00Z') });
    const reservations = ['2029-06-01', '2029-06-02', '2029-06-03', '2029-06-04'].map((date, index) => ({
        id: index + 1,
        evenementId: index + 10,
        userId: 20,
        createdAt: new Date('2029-05-28T10:00:00Z'),
        evenement: {
            id: index + 10,
            description: 'Match amical',
            location: 'Gymnase',
            date,
            capacity: 2,
            creatorId: 42,
            cancelledAt: index === 3 ? new Date('2029-06-01T20:00:00Z') : null,
            cancellationReason: index === 3 ? 'Gymnase indisponible' : null
        }
    }));
    const listByUserId = t.mock.fn(async () => reservations);
    const controller = getMyReservationsController(makeGetMyReservationsUseCase({ listByUserId }));
    const response = {
        status: t.mock.fn(() => response),
        set: t.mock.fn(() => response),
        json: t.mock.fn()
    };

    await controller({ user: { id: 20 } }, response);

    assert.deepEqual(listByUserId.mock.calls[0].arguments, [20]);
    assert.deepEqual(response.status.mock.calls[0].arguments, [200]);
    const [payload] = response.json.mock.calls[0].arguments;
    assert.deepEqual(payload.map(({ evenement }) => [evenement.date, evenement.status]), [
        ['2029-06-01', 'finished'],
        ['2029-06-02', 'today'],
        ['2029-06-03', 'upcoming'],
        ['2029-06-04', 'cancelled']
    ]);
    assert.equal(payload[3].evenement.description, 'Gymnase indisponible');
});
