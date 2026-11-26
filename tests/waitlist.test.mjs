import assert from 'node:assert/strict';
import { test } from 'node:test';
import { db } from '../src/core/dataBase.config.ts';
import { EvenementEntity } from '../src/profile/evenement/infra/persistance/entities/evenement.entity.ts';
import { DEFAULT_USER_PERMISSIONS, isGrantableUserPermission, USER_PERMISSIONS } from '../src/profile/user/domain/permissions/user.permissions.ts';
import { makeJoinWaitlistUseCase } from '../src/reservation/app/usecases/join-waitlist.usecase.ts';
import { makeLeaveWaitlistUseCase } from '../src/reservation/app/usecases/leave-waitlist.usecase.ts';
import { makeListWaitlistUseCase } from '../src/reservation/app/usecases/list-waitlist.usecase.ts';
import { makeMoveWaitlistEntryUpUseCase } from '../src/reservation/app/usecases/move-waitlist-entry-up.usecase.ts';
import { ReservationEntity } from '../src/reservation/infra/persistance/entities/reservation.entity.ts';
import { WaitlistEntryEntity } from '../src/reservation/infra/persistance/entities/waitlist-entry.entity.ts';
import { typeormWaitlistGateway } from '../src/reservation/infra/persistance/repositories/typeorm-waitlist.gateway.ts';

const join = makeJoinWaitlistUseCase(typeormWaitlistGateway);
const leave = makeLeaveWaitlistUseCase(typeormWaitlistGateway);
const list = makeListWaitlistUseCase(typeormWaitlistGateway);
const moveUp = makeMoveWaitlistEntryUpUseCase(typeormWaitlistGateway);

function setup(t) {
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2029-06-02T12:00:00Z') });
    const event = { id: 10, creatorId: 1, capacity: 1, date: '2029-06-03', cancelledAt: null };
    const rows = [];
    let nextId = 0;
    const matching = where => rows.filter(row => Object.entries(where).every(([key, value]) => (
        value?.type === 'lessThan' ? row[key] < value.value : row[key] === value
    )));
    const entries = {
        async existsBy(where) { return matching(where).length > 0; },
        async countBy(where) { return matching(where).length; },
        async findOne({ where, order }) {
            const found = matching(where);
            if (order) found.sort((a, b) => b.sortOrder - a.sortOrder);
            return found.length === 0 ? null : { ...found[0] };
        },
        create: row => row,
        async save(row) {
            const entry = { ...row, id: ++nextId };
            rows.push(entry);
            return entry;
        },
        async update(id, changes) { Object.assign(matching({ id })[0], changes); },
        async delete(where) {
            const row = matching(where)[0];
            if (!row) return { affected: 0 };
            rows.splice(rows.indexOf(row), 1);
            return { affected: 1 };
        },
        createQueryBuilder() {
            let eventId;
            return {
                innerJoin() { return this; },
                select() { return this; },
                addSelect() { return this; },
                where(_where, params) { eventId = params.evenementId; return this; },
                orderBy(key, direction) {
                    assert.deepEqual([key, direction], ['entry.sortOrder', 'ASC']);
                    return this;
                },
                async getRawMany() {
                    return matching({ evenementId: eventId }).sort((a, b) => a.sortOrder - b.sortOrder)
                        .map(({ id, userId }) => ({ id, name: 'Martin', firstname: `Joueur ${userId}` }));
                }
            };
        }
    };
    const events = { async findOne({ where }) { return where.id === event.id ? event : null; } };
    const getRepository = entity => {
        if (entity === EvenementEntity) return events;
        if (entity === WaitlistEntryEntity) return entries;
        assert.equal(entity, ReservationEntity);
        return { existsBy: async ({ userId }) => userId === 20, countBy: async () => 1 };
    };
    t.mock.method(db, 'getRepository', getRepository);
    let lastTransaction = Promise.resolve();
    t.mock.method(db, 'transaction', (isolation, run) => {
        assert.equal(isolation, 'READ COMMITTED');
        const lockedEvents = { async findOne(options) {
            assert.deepEqual(options.lock, { mode: 'pessimistic_write' });
            return events.findOne(options);
        } };
        const result = lastTransaction.then(() => run({
            getRepository: entity => entity === EvenementEntity ? lockedEvents : getRepository(entity)
        }));
        lastTransaction = result.then(() => {}, () => {});
        return result;
    });
    return event;
}

const input = userId => ({ evenementId: 10, userId });

test('les inscriptions en file restent distinctes des réservations et suivent l’ordre d’arrivée', async t => {
    const event = setup(t);
    await assert.rejects(join(input(20)), { statusCode: 409, errorid: 'RESERVATION_001' });
    const [first, second] = await Promise.all([join(input(21)), join(input(22))]);
    assert.deepEqual([first.position, second.position], [1, 2]);
    await assert.rejects(join(input(21)), { statusCode: 409, errorid: 'WAITLIST_001' });
    event.capacity = 2;
    await assert.rejects(join(input(23)), { statusCode: 409, errorid: 'WAITLIST_002' });
    await leave(input(21));
    await assert.rejects(leave(input(21)), { statusCode: 404, errorid: 'WAITLIST_003' });
    assert.deepEqual(await list(10, 1, DEFAULT_USER_PERMISSIONS), [
        { id: second.id, position: 1, name: 'Martin', firstname: 'Joueur 22' }
    ]);
});

test('le créateur et le droit 2048 permettent de consulter et de remonter une entrée d’un rang', async t => {
    setup(t);
    const first = await join(input(21));
    const second = await join(input(22));
    const third = await join(input(23));
    const permission = USER_PERMISSIONS.MANAGE_OTHER_EVENT_WAITLISTS;
    assert.equal(permission, 2048);
    assert.equal(isGrantableUserPermission(permission), true);
    await assert.rejects(list(10, 2, DEFAULT_USER_PERMISSIONS), { statusCode: 403, errorid: 'AUTH_006' });
    await assert.rejects(moveUp(10, third.id, 2, DEFAULT_USER_PERMISSIONS), { statusCode: 403, errorid: 'AUTH_006' });

    assert.deepEqual(await moveUp(10, third.id, 1, DEFAULT_USER_PERMISSIONS), { id: third.id, position: 2 });
    assert.deepEqual((await list(10, 2, permission)).map(entry => entry.id), [first.id, third.id, second.id]);
    assert.deepEqual(await moveUp(10, third.id, 2, permission), { id: third.id, position: 1 });
    assert.deepEqual(await moveUp(10, third.id, 2, permission), { id: third.id, position: 1 });
    assert.deepEqual((await list(10, 1, DEFAULT_USER_PERMISSIONS)).map(entry => entry.id), [third.id, first.id, second.id]);
});

test('un événement annulé ou passé ferme les nouvelles entrées en file', async t => {
    const event = setup(t);
    event.cancelledAt = new Date();
    await assert.rejects(join(input(21)), { statusCode: 409, errorid: 'EVENEMENT_009' });
    event.cancelledAt = null;
    event.date = '2029-06-01';
    await assert.rejects(join(input(21)), { statusCode: 409, errorid: 'RESERVATION_005' });
});
