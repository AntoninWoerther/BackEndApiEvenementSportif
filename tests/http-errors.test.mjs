import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { Duplex } from 'node:stream';
import { test } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { ExpiredRefreshTokenError } from '../src/auth/domain/errors/expired-refresh-token.error.ts';
import { InvalidRefreshTokenError } from '../src/auth/domain/errors/invalid-refresh-token.error.ts';
import { RevokedRefreshTokenError } from '../src/auth/domain/errors/revoked-refresh-token.error.ts';
import { makeAuthMiddleware } from '../src/auth/infra/gards/auth.middleware.ts';
import { makeLoadUserPermissions } from '../src/auth/infra/gards/user-permissions.middleware.ts';
import { createAuthRouter } from '../src/auth/presentation/routes/auth.route.ts';
import { db } from '../src/core/dataBase.config.ts';
import { errorMiddleware } from '../src/core/middleware/erreur.middleware.ts';
import { DEFAULT_USER_PERMISSIONS, USER_PERMISSIONS } from '../src/profile/user/domain/permissions/user.permissions.ts';
import { createUserRouter } from '../src/profile/user/presentation/routes/user.route.ts';

function createAuthTestApp(refresh) {
    const app = express();
    app.use(express.json());
    app.use('/auth', createAuthRouter({
        authMiddleware: makeAuthMiddleware({ hasActiveSession: async () => true }),
        refresh
    }));
    app.use(errorMiddleware);
    return app;
}

async function request(app, method, path, { body = '', headers = {} } = {}) {
    // Exercise Express's HTTP handlers without opening a network port.
    const server = createServer(app);
    let response = '';
    const socket = new Duplex({
        read() {},
        write(chunk, _encoding, done) {
            response += chunk.toString();
            done();
        }
    });
    socket.setTimeout = () => socket;
    const finished = once(socket, 'finish');
    const lines = [
        `${method} ${path} HTTP/1.1`,
        'Host: localhost',
        'Connection: close',
        `Content-Length: ${Buffer.byteLength(body)}`,
        ...Object.entries(headers).map(([name, value]) => `${name}: ${value}`),
        '',
        body
    ];
    server.emit('connection', socket);
    socket.push(lines.join('\r\n'));
    await finished;
    const [head, payload] = response.split('\r\n\r\n');
    return { status: Number(head.split(' ')[1]), payload: JSON.parse(payload) };
}

function assertError(response, status, idcode) {
    assert.equal(response.status, status);
    assert.equal(response.payload.statusCode, status);
    assert.equal(response.payload.idcode, idcode);
    assert.equal(typeof response.payload.message, 'string');
}

function setJwtSecret(t, secret) {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;
    t.after(() => {
        if (previousSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = previousSecret;
        }
    });
}

const jsonHeaders = { 'Content-Type': 'application/json' };
const refreshBody = JSON.stringify({ refreshToken: 'jeton-de-test' });

test('un jeton de renouvellement invalide, révoqué ou expiré conserve son code métier', async () => {
    const tokenErrors = [
        [new InvalidRefreshTokenError(), 'AUTH_003'],
        [new RevokedRefreshTokenError(), 'AUTH_004'],
        [new ExpiredRefreshTokenError(), 'AUTH_005']
    ];

    for (const [error, idcode] of tokenErrors) {
        const app = createAuthTestApp(async () => { throw error; });
        const response = await request(app, 'POST', '/auth/refresh', { body: refreshBody, headers: jsonHeaders });
        assertError(response, 401, idcode);
    }
});

test('un échec interne du renouvellement renvoie 500 avec un message public générique', async t => {
    t.mock.method(console, 'error', () => {});
    const app = createAuthTestApp(async () => { throw new Error('Détail SQL interne.'); });

    const response = await request(app, 'POST', '/auth/refresh', { body: refreshBody, headers: jsonHeaders });

    assertError(response, 500, 'err-00-500');
    assert.equal(response.payload.message, 'Erreur interne du serveur.');
});

test('la validation du renouvellement utilise le format commun et inclut les champs invalides', async () => {
    const response = await request(createAuthTestApp(), 'POST', '/auth/refresh', { body: '{}', headers: jsonHeaders });

    assertError(response, 400, 'ERR_VALI_400');
    assert.match(JSON.stringify(response.payload.fields), /refreshToken/);
});

test('une route protégée sans jeton renvoie le format commun', async () => {
    const response = await request(createAuthTestApp(), 'GET', '/auth/me');

    assertError(response, 401, 'AUTH_002');
    assert.equal(response.payload.message, 'Token manquant.');
});

test('seul le superadmin peut consulter la liste et le détail des comptes', async t => {
    const secret = 'cle-jwt-pour-les-tests-http';
    setJwtSecret(t, secret);
    const account = { id: 3, name: 'Martin', firstname: 'Camille' };
    const find = t.mock.fn(async () => [account]);
    const findOne = t.mock.fn(async () => account);
    t.mock.method(db, 'getRepository', () => ({ find, findOne }));

    const app = express();
    app.use(createUserRouter({
        authMiddleware: makeAuthMiddleware({ hasActiveSession: async () => true }),
        loadUserPermissions: makeLoadUserPermissions({
            findPermissionsByUserId: async id => id === 1 ? USER_PERMISSIONS.SUPERUSER : DEFAULT_USER_PERMISSIONS
        })
    }));
    app.use(errorMiddleware);

    const bearer = id => ({ Authorization: `Bearer ${jwt.sign({ sub: id, sid: 'session-de-test' }, secret)}` });
    for (const path of ['/', '/3']) {
        assertError(await request(app, 'GET', path), 401, 'AUTH_002');
        assertError(await request(app, 'GET', path, { headers: bearer(2) }), 403, 'AUTH_006');
    }
    assert.equal(find.mock.callCount() + findOne.mock.callCount(), 0);

    const headers = bearer(1);
    assert.deepEqual(await request(app, 'GET', '/', { headers }), { status: 200, payload: [account] });
    assert.deepEqual(await request(app, 'GET', '/3', { headers }), { status: 200, payload: account });
});

test('le profil d’un compte introuvable utilise le code USER_001', async t => {
    const secret = 'cle-jwt-pour-les-tests-http';
    setJwtSecret(t, secret);
    t.mock.method(db, 'getRepository', () => ({ findOne: async () => null }));

    const app = createAuthTestApp();
    const token = jwt.sign({ sub: 42, sid: 'session-de-test' }, secret);
    const response = await request(app, 'GET', '/auth/me', { headers: { Authorization: `Bearer ${token}` } });

    assertError(response, 404, 'USER_001');
});

test('une erreur de configuration JWT donne 500 et un jeton invalide donne 401', async t => {
    setJwtSecret(t, 'cle-jwt-pour-les-tests-http');
    t.mock.method(console, 'error', () => {});
    const app = createAuthTestApp();
    const headers = { Authorization: 'Bearer jeton-invalide' };

    assertError(await request(app, 'GET', '/auth/me', { headers }), 401, 'AUTH_002');

    delete process.env.JWT_SECRET;
    assertError(await request(app, 'GET', '/auth/me', { headers }), 500, 'err-00-500');
});

test('les erreurs du parseur JSON conservent le format commun', async () => {
    const app = createAuthTestApp();
    const malformed = await request(app, 'POST', '/auth/refresh', { body: '{', headers: jsonHeaders });
    assertError(malformed, 400, 'ERR_VALI_400');

    const incompatible = await request(app, 'POST', '/auth/refresh', {
        body: '{}',
        headers: { 'Content-Type': 'application/json; charset=latin1' }
    });
    assertError(incompatible, 415, 'ERR_BODY_ENCODING');

    const tooLarge = await request(app, 'POST', '/auth/refresh', {
        body: JSON.stringify({ refreshToken: 'a'.repeat(102_400) }),
        headers: jsonHeaders
    });
    assertError(tooLarge, 413, 'ERR_BODY_TOO_LARGE');
});
