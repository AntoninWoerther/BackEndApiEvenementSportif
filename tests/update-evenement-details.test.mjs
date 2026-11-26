import assert from 'node:assert/strict';
import { test } from 'node:test';
import { db } from '../src/core/dataBase.config.ts';
import { makeUpdateEvenementDateUseCase } from '../src/profile/evenement/app/usecases/update-evenement-date.usecase.ts';
import { makeUpdateEvenementDetailsUseCase } from '../src/profile/evenement/app/usecases/update-evenement-details.usecase.ts';
import { EvenementEntity } from '../src/profile/evenement/infra/persistance/entities/evenement.entity.ts';
import { typeormEvenementGateway } from '../src/profile/evenement/infra/persistance/repositories/typeorm-evenement.gateway.ts';
import { updateEvenementDetailsController } from '../src/profile/evenement/presentation/controllers/evenement.controller.ts';
import { USER_PERMISSIONS } from '../src/profile/user/domain/permissions/user.permissions.ts';
import { ReservationEntity } from '../src/reservation/infra/persistance/entities/reservation.entity.ts';

const event = { id: 10, creatorId: 20, description: 'Match amical', location: 'Terrain A', capacity: 8, date: '2030-05-08' };
const { UPDATE_EVENT, UPDATE_OTHER_EVENTS } = USER_PERMISSIONS;

function setup(t, registrations = 3) {
    let stored = { ...event };
    const update = t.mock.fn(async (id, changes) => {
        assert.equal(id, event.id);
        stored = { ...stored, ...changes };
    });
    const countBy = t.mock.fn(async criteria => {
        assert.deepEqual(criteria, { evenementId: event.id });
        return registrations;
    });
    const repositories = new Map([
        [EvenementEntity, {
            async findOne({ where, lock }) {
                assert.deepEqual(lock, { mode: 'pessimistic_write' });
                return where.id === event.id ? stored : null;
            },
            update
        }],
        [ReservationEntity, { countBy }]
    ]);
    const transaction = t.mock.method(db, 'transaction', (isolation, run) => {
        assert.equal(isolation, 'READ COMMITTED');
        return run({ getRepository: entity => repositories.get(entity) });
    });
    const updateDetails = makeUpdateEvenementDetailsUseCase(typeormEvenementGateway, { publish: t.mock.fn() });
    return { update, countBy, transaction, updateDetails };
}

test('le créateur peut modifier uniquement le lieu puis la description et la capacité de son événement', async t => {
    const { countBy, updateDetails } = setup(t);
    const controller = updateEvenementDetailsController(updateDetails);
    const reply = {
        status(code) {
            assert.equal(code, 200);
            return this;
        },
        json: body => body
    };
    const request = { params: { id: '10' }, user: { id: 20, permissions: UPDATE_EVENT } };

    const moved = await controller({ ...request, body: { location: ' Terrain B ' } }, reply);
    assert.deepEqual(moved, { ...event, location: 'Terrain B' });
    assert.equal(countBy.mock.callCount(), 0);

    const updated = await controller({ ...request, body: { description: 'Tournoi', capacity: 3 } }, reply);
    assert.deepEqual(updated, { ...moved, description: 'Tournoi', capacity: 3 });
    assert.equal(countBy.mock.callCount(), 1);
});

test('une capacité inférieure au nombre d’inscrits refuse toute la modification', async t => {
    const { update, updateDetails } = setup(t);

    await assert.rejects(updateDetails(10, 20, { location: 'Terrain B', capacity: 2 }, UPDATE_EVENT), {
        errorid: 'EVENEMENT_007'
    });
    assert.equal(update.mock.callCount(), 0);
});

test('le droit de modification distingue ses événements de ceux des autres', async t => {
    const { update, countBy, updateDetails } = setup(t);
    const input = { capacity: 4 };

    await assert.rejects(updateDetails(10, 21, input, UPDATE_EVENT), { errorid: 'EVENEMENT_006' });
    await assert.rejects(updateDetails(10, 20, input, UPDATE_OTHER_EVENTS), { errorid: 'EVENEMENT_006' });
    await assert.rejects(updateDetails(99, 20, input, UPDATE_EVENT), { errorid: 'EVENEMENT_003' });
    assert.equal(countBy.mock.callCount(), 0);
    assert.equal(update.mock.callCount(), 0);
    assert.deepEqual(await updateDetails(10, 21, input, UPDATE_OTHER_EVENTS), { ...event, capacity: 4 });
});

test('le refus de modifier la date utilise le même code que le refus de modifier les autres détails', async t => {
    const publish = t.mock.fn();
    const updateDate = makeUpdateEvenementDateUseCase({ updateDate: async () => 'forbidden' }, { publish });

    await assert.rejects(updateDate(10, 21, '2030-05-09', UPDATE_EVENT), {
        errorid: 'EVENEMENT_006'
    });
    assert.equal(publish.mock.callCount(), 0);
});

test('les données vides, invalides et les champs hors périmètre sont refusés avant la transaction', async t => {
    const { transaction, updateDetails } = setup(t);
    const controller = updateEvenementDetailsController(updateDetails);
    const request = { params: { id: '10' }, user: { id: 20, permissions: UPDATE_EVENT } };

    for (const body of [{}, { location: ' ' }, { description: null }, { capacity: 1.5 }, { capacity: 0 }, { date: '2030-05-09' }]) {
        await assert.rejects(controller({ ...request, body }, {}), { errorid: 'ERR_VALI_400' });
    }
    assert.equal(transaction.mock.callCount(), 0);
});
