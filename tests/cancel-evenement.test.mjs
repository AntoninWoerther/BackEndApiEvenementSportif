import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IsNull, LessThanOrEqual } from 'typeorm';
import { db } from '../src/core/dataBase.config.ts';
import { makeNodeEventBus } from '../src/core/infra/bus/node-event-bus.ts';
import { makeCancelEvenementUseCase } from '../src/profile/evenement/app/usecases/cancel-evenement.usecase.ts';
import { makeCleanupEvenementsUseCase } from '../src/profile/evenement/app/usecases/cleanup-evenements.usecase.ts';
import { makeDeleteEvenementUseCase } from '../src/profile/evenement/app/usecases/delete-evenement.usecase.ts';
import { EVENEMENT_EVENTS } from '../src/profile/evenement/domain/events/evenement.events.ts';
import { registerEvenementCancellationEmailListener } from '../src/profile/evenement/infra/mailer/evenement-cancellation-email.listener.ts';
import { EvenementEntity } from '../src/profile/evenement/infra/persistance/entities/evenement.entity.ts';
import { typeormEvenementCleanupGateway } from '../src/profile/evenement/infra/persistance/repositories/typeorm-evenement-cleanup.gateway.ts';
import { typeormEvenementGateway } from '../src/profile/evenement/infra/persistance/repositories/typeorm-evenement.gateway.ts';
import { cancelEvenementController } from '../src/profile/evenement/presentation/controllers/evenement.controller.ts';
import { isGrantableUserPermission, USER_PERMISSIONS } from '../src/profile/user/domain/permissions/user.permissions.ts';
import { ReservationEntity } from '../src/reservation/infra/persistance/entities/reservation.entity.ts';

const now = new Date('2029-06-06T12:00:00Z');
const reason = 'Gymnase indisponible';

function seedEvent(t) {
    t.mock.timers.enable({ apis: ['Date'], now });
    const event = {
        id: 10, creatorId: 20, date: '2029-06-09', location: 'Gymnase',
        description: 'Match amical', capacity: 5, cancelledAt: null, cancellationReason: null
    };
    const events = {
        async findOne({ where, lock }) {
            if (lock) assert.deepEqual(lock, { mode: 'pessimistic_write' });
            return where.id === event.id ? { ...event } : null;
        },
        async update(id, changes) {
            assert.equal(id, event.id);
            Object.assign(event, changes);
        },
        async delete(where) {
            assert.deepEqual(where, { id: 10, creatorId: 20, cancelledAt: IsNull() });
            return { affected: 0 };
        }
    };
    const loadRecipients = t.mock.fn(async () => [{ email: 'a@example.test' }, { email: 'b@example.test' }]);
    const reservations = {
        createQueryBuilder() {
            return {
                innerJoin() { return this; },
                select() { return this; },
                where(_query, params) {
                    assert.deepEqual(params, { evenementId: 10 });
                    return this;
                },
                getRawMany: loadRecipients
            };
        }
    };
    const repositories = new Map([[EvenementEntity, events], [ReservationEntity, reservations]]);
    t.mock.method(db, 'getRepository', entity => repositories.get(entity));
    t.mock.method(db, 'transaction', (isolation, run) => {
        assert.equal(isolation, 'READ COMMITTED');
        return run({ getRepository: entity => repositories.get(entity) });
    });

    return { event, loadRecipients };
}

test('le créateur annule son événement, affiche le motif et notifie chacun des inscrits une seule fois', async t => {
    const { event, loadRecipients } = seedEvent(t);
    const log = t.mock.method(console, 'log', () => {});
    const bus = makeNodeEventBus();
    registerEvenementCancellationEmailListener(bus);
    const controller = cancelEvenementController(makeCancelEvenementUseCase(typeormEvenementGateway, bus));
    const response = { status(code) { assert.equal(code, 200); return this; }, json: body => body };
    const request = { params: { id: '10' }, user: { id: 20 }, body: { reason: ` ${reason} ` } };

    await assert.rejects(controller({ ...request, body: { reason: ' ' } }, response), { errorid: 'ERR_VALI_400' });
    const result = await controller(request, response);
    assert.equal(result.description, reason);
    assert.deepEqual(result.cancelledAt, now);
    assert.equal(event.description, 'Match amical');
    assert.equal(loadRecipients.mock.callCount(), 1);
    assert.deepEqual(log.mock.calls.map(call => call.arguments[0]), [
        `[MAIL] À a@example.test | L’événement n°10 du 2029-06-09 à Gymnase est annulé. Motif : ${reason}`,
        `[MAIL] À b@example.test | L’événement n°10 du 2029-06-09 à Gymnase est annulé. Motif : ${reason}`
    ]);

    await assert.rejects(controller(request, response), { errorid: 'EVENEMENT_009' });
    await assert.rejects(makeDeleteEvenementUseCase(typeormEvenementGateway)(10, 20), { errorid: 'EVENEMENT_009' });
    assert.equal(log.mock.callCount(), 2);
});

test('l’annulation de l’événement d’un autre créateur exige le droit 1024', async t => {
    const { event, loadRecipients } = seedEvent(t);
    const publish = t.mock.fn();
    const cancelEvenement = makeCancelEvenementUseCase(typeormEvenementGateway, { publish });
    const permission = USER_PERMISSIONS.CANCEL_OTHER_EVENTS;
    assert.equal(permission, 1024);
    assert.equal(isGrantableUserPermission(permission), true);

    await assert.rejects(cancelEvenement(10, 21, reason, USER_PERMISSIONS.UPDATE_OTHER_EVENTS), {
        errorid: 'EVENEMENT_008'
    });
    assert.equal(event.cancelledAt, null);
    assert.equal(loadRecipients.mock.callCount(), 0);
    assert.equal(publish.mock.callCount(), 0);

    const cancelled = await cancelEvenement(10, 21, reason, permission);
    assert.equal(cancelled.cancellationReason, reason);
    assert.deepEqual(publish.mock.calls.map(call => call.arguments), [[EVENEMENT_EVENTS.CANCELLED, {
        evenementId: 10, date: '2029-06-09', location: 'Gymnase', reason,
        participantEmails: ['a@example.test', 'b@example.test']
    }]]);
});

test('le nettoyage retient les événements annulés cinq jours depuis leur annulation', async t => {
    const remove = t.mock.fn(async () => ({ affected: 1 }));
    const find = t.mock.fn(async () => []);
    t.mock.method(db, 'getRepository', () => ({ delete: remove, find }));

    const publish = t.mock.fn();
    const cleanup = makeCleanupEvenementsUseCase(typeormEvenementCleanupGateway, { publish });
    assert.equal(await cleanup(now), 1);
    assert.deepEqual(remove.mock.calls[0].arguments, [[
        { date: LessThanOrEqual('2029-05-30'), cancelledAt: IsNull() },
        { cancelledAt: LessThanOrEqual(new Date('2029-06-01T12:00:00Z')) }
    ]]);
    assert.deepEqual(find.mock.calls[0].arguments[0].where.cancelledAt, IsNull());
    assert.equal(publish.mock.callCount(), 0);
});
