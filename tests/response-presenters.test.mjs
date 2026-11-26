import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLoginController, createRefreshController } from '../src/auth/presentation/controllers/auth.controller.ts';
import { createExportUserPermissionChangesController } from '../src/profile/user/presentation/controllers/user.controller.ts';
import { getEventParticipantsController } from '../src/reservation/presentation/controllers/reservation.controller.ts';

const reply = {
    status(code) {
        assert.equal(code, 200);
        return this;
    },
    attachment(filename) {
        assert.equal(filename, 'user-permission-changes.json');
        return this;
    },
    set() { return this; },
    json: body => body
};

test('la connexion et le renouvellement exposent uniquement le profil public et les jetons prévus', async () => {
    const profile = { id: 1, name: 'Martin', firstname: 'Camille' };
    const tokens = { accessToken: 'jeton-acces-de-test', refreshToken: 'jeton-renouvellement-de-test' };
    const internalTokens = { ...tokens, sessionId: 'session-interne' };
    const login = createLoginController(async () => ({
        ...internalTokens,
        user: { ...profile, email: 'camille@example.test', hashedPassword: 'hash-de-test' }
    }));
    const refresh = createRefreshController(async () => internalTokens);

    const loggedIn = await login({ body: { email: 'camille@example.test', password: 'test-password' } }, reply);
    assert.deepEqual(JSON.parse(JSON.stringify(loggedIn)), { user: profile, ...tokens });
    assert.deepEqual(await refresh({ body: { refreshToken: tokens.refreshToken } }, reply), tokens);
});

test('la liste des inscrits projette le nom et le prénom même si le use case fournit d’autres champs', async () => {
    const participant = { name: 'Martin', firstname: 'Camille' };
    const controller = getEventParticipantsController(async () => [
        { ...participant, userId: 1, email: 'camille@example.test' }
    ]);

    const response = await controller({ user: { id: 2, permissions: 0 }, params: { evenementId: '10' } }, reply);
    assert.deepEqual(response, [participant]);
});

test('l’export du journal projette uniquement les champs publics de chaque changement', async () => {
    const change = {
        id: 1, actorId: 2, userId: 3, previousPermissions: 7, newPermissions: 519,
        createdAt: new Date('2030-01-01T12:00:00Z')
    };
    const controller = createExportUserPermissionChangesController(async () => [{ ...change, internalNote: 'interne' }]);

    assert.deepEqual(await controller({}, reply), [change]);
});
