import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_USER_PERMISSIONS, isGrantableUserPermission, USER_PERMISSIONS } from '../src/profile/user/domain/permissions/user.permissions.ts';
import { makeGetEventParticipantsUseCase } from '../src/reservation/app/usecases/get-event-participants.usecase.ts';

const defaultUser = { id: 1, permissions: DEFAULT_USER_PERMISSIONS };
const otherUser = { ...defaultUser, id: 2 };
const participants = [{ name: 'Martin', firstname: 'Camille' }];

function setup(t, creatorId = defaultUser.id, registrations = participants) {
    const listEventParticipants = t.mock.fn(async () => registrations);
    const getEventParticipants = makeGetEventParticipantsUseCase({
        async findEvenementOwner(evenementId) {
            return evenementId === 10 ? { creatorId } : null;
        },
        listEventParticipants
    });

    return { getEventParticipants, listEventParticipants };
}

test('le créateur consulte les inscrits de son événement avec ses droits par défaut', async t => {
    const { getEventParticipants, listEventParticipants } = setup(t);

    assert.deepEqual(await getEventParticipants(10, defaultUser), participants);
    assert.deepEqual(listEventParticipants.mock.calls[0].arguments, [10]);
});

test('les inscriptions d’un autre organisateur restent inaccessibles sans le droit 512', async t => {
    const { getEventParticipants, listEventParticipants } = setup(t);
    const permissions = otherUser.permissions | USER_PERMISSIONS.REMOVE_EVENT_PARTICIPANTS;

    await assert.rejects(getEventParticipants(10, { ...otherUser, permissions }), {
        statusCode: 403,
        errorid: 'AUTH_006'
    });
    assert.equal(listEventParticipants.mock.callCount(), 0);
});

test('le droit attribuable 512 et le droit superadmin donnent accès aux inscrits des autres événements', async t => {
    const { getEventParticipants } = setup(t, null);
    const viewPermission = USER_PERMISSIONS.VIEW_OTHER_EVENT_PARTICIPANTS;
    assert.equal(viewPermission, 512);
    assert.equal(isGrantableUserPermission(viewPermission), true);

    const permittedUser = { ...otherUser, permissions: otherUser.permissions | viewPermission };
    const superuser = { ...otherUser, permissions: USER_PERMISSIONS.SUPERUSER };
    assert.deepEqual(await getEventParticipants(10, permittedUser), participants);
    assert.deepEqual(await getEventParticipants(10, superuser), participants);
});

test('un événement sans inscription renvoie un tableau vide et un événement absent renvoie 404', async t => {
    const { getEventParticipants, listEventParticipants } = setup(t, defaultUser.id, []);

    assert.deepEqual(await getEventParticipants(10, defaultUser), []);
    await assert.rejects(getEventParticipants(99, defaultUser), {
        statusCode: 404,
        errorid: 'EVENEMENT_003'
    });
    assert.equal(listEventParticipants.mock.callCount(), 1);
});
