import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IsNull, MoreThan } from 'typeorm';
import { createRefreshUseCase } from '../src/auth/app/usecases/refresh.usecase.ts';
import { RefreshTokenEntity } from '../src/auth/infra/persistance/entities/refresh-token.entity.ts';
import { typeormRefreshTokenGateway } from '../src/auth/infra/persistance/repositories/typeorm-refresh-token.gateway.ts';
import { verifyAccessToken } from '../src/auth/infra/security/access-token.security.ts';
import { nodeTokenSecurityGateway } from '../src/auth/infra/security/node-token-security.gateway.ts';
import { hashRefreshToken } from '../src/auth/infra/security/refresh-token.security.ts';
import { db } from '../src/core/dataBase.config.ts';
import { UserEntity } from '../src/profile/user/infra/persistance/entities/user.entity.ts';

const refresh = createRefreshUseCase(typeormRefreshTokenGateway, nodeTokenSecurityGateway);
const initialToken = 'jeton-de-renouvellement-de-test';
const userId = 42;
const sessionId = 'e92713ab-4ca5-4faf-b0db-35eaf7fd7cca';
const now = new Date('2030-01-01T00:00:00Z');

function seedSession(t, expiresAt = new Date('2030-01-02T00:00:00Z')) {
    t.mock.timers.enable({ apis: ['Date'], now });
    const jwtEnvironment = { JWT_SECRET: 'cle-jwt-pour-les-tests', JWT_EXPIRES_IN: '5m' };
    for (const [key, value] of Object.entries(jwtEnvironment)) {
        const previous = process.env[key];
        process.env[key] = value;
        t.after(() => {
            if (previous === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = previous;
            }
        });
    }

    const tokens = [{ id: 1, userId, sessionId, expiresAt, revokedAt: null, hashedToken: hashRefreshToken(initialToken) }];
    const tokenRepository = {
        async findOne({ where: { hashedToken } }) {
            const row = tokens.find(token => token.hashedToken === hashedToken);
            return row ? { ...row } : null;
        },
        async update(where, values) {
            assert.deepEqual(where.revokedAt, IsNull());
            assert.deepEqual(where.expiresAt, MoreThan(now));
            const row = tokens.find(token => token.id === where.id && token.userId === where.userId);
            if (!row || row.revokedAt !== null || row.expiresAt <= where.expiresAt.value) {
                return { affected: 0 };
            }
            Object.assign(row, values);
            return { affected: 1 };
        },
        async insert(token) {
            tokens.push({ ...token, id: tokens.length + 1 });
        }
    };
    const repositories = new Map([
        [RefreshTokenEntity, tokenRepository],
        [UserEntity, {
            async findOne({ where, lock }) {
                assert.deepEqual(lock, { mode: 'pessimistic_write' });
                return where.id === userId ? { id: userId, suspendedAt: null } : null;
            }
        }]
    ]);
    const getRepository = entity => repositories.get(entity);
    t.mock.method(db, 'getRepository', getRepository);
    t.mock.method(db, 'transaction', run => run({ getRepository }));

    return tokens;
}

test('le renouvellement révoque l’ancien jeton et conserve la même session', async t => {
    const tokens = seedSession(t);
    const { accessToken, refreshToken } = await refresh(initialToken);

    assert.notEqual(refreshToken, initialToken);
    const claims = verifyAccessToken(accessToken);
    assert.equal(claims.sub, userId);
    assert.equal(claims.sid, sessionId);
    assert.equal(tokens.length, 2);
    assert.deepEqual(tokens[0].revokedAt, now);
    assert.equal(tokens[1].revokedAt, null);
    assert.equal(tokens[1].hashedToken, hashRefreshToken(refreshToken));
    assert.equal(tokens[1].sessionId, sessionId);

    await assert.rejects(refresh(initialToken), { errorid: 'AUTH_003' });
    await refresh(refreshToken);
    assert.equal(tokens.length, 3);
    assert.deepEqual(tokens[1].revokedAt, now);
});

test('un jeton arrivé à expiration ne peut pas être renouvelé', async t => {
    const tokens = seedSession(t, now);

    await assert.rejects(refresh(initialToken), { errorid: 'AUTH_003' });
    assert.equal(tokens.length, 1);
    assert.equal(tokens[0].revokedAt, null);
});

test('deux renouvellements simultanés du même jeton ne produisent qu’un remplaçant', async t => {
    const tokens = seedSession(t);
    const results = await Promise.allSettled([refresh(initialToken), refresh(initialToken)]);

    const successful = results.filter(result => result.status === 'fulfilled');
    const rejected = results.filter(result => result.status === 'rejected');
    assert.equal(successful.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].reason.errorid, 'AUTH_003');
    assert.equal(tokens.length, 2);
    assert.equal(tokens[1].hashedToken, hashRefreshToken(successful[0].value.refreshToken));
});
