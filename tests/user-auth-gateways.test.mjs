import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryFailedError } from 'typeorm';
import { createIssueRefreshTokenUseCase } from '../src/auth/app/usecases/create-refresh-token.usecase.ts';
import { createLoginUseCase } from '../src/auth/app/usecases/login.usecase.ts';
import { verifyAccessToken } from '../src/auth/infra/security/access-token.security.ts';
import { nodeTokenSecurityGateway } from '../src/auth/infra/security/node-token-security.gateway.ts';
import { db } from '../src/core/dataBase.config.ts';
import { eventEmitter } from '../src/core/bus/event.emiter.ts';
import { createChangePasswordUseCase } from '../src/profile/user/app/usecases/change-password.usecase.ts';
import { makeCreateUserUseCase } from '../src/profile/user/app/usecases/create-user.usecase.ts';
import { USER_EVENTS } from '../src/profile/user/domain/events/user.events.ts';
import { UserEntity } from '../src/profile/user/infra/persistance/entities/user.entity.ts';
import { typeormUserPasswordGateway } from '../src/profile/user/infra/persistance/repositories/typeorm-user-password.gateway.ts';
import { typeormUserGateway } from '../src/profile/user/infra/persistance/repositories/typeorm-user.gateway.ts';
import { bcryptPasswordHasherGateway } from '../src/profile/user/infra/security/bcrypt-password-hasher.gateway.ts';

test('les gateways injectés permettent l’inscription, la connexion et le changement de mot de passe', async t => {
    for (const [key, value] of Object.entries({ JWT_SECRET: 'cle-jwt-pour-les-tests-gateways', JWT_EXPIRES_IN: '5m' })) {
        const previous = process.env[key];
        process.env[key] = value;
        t.after(() => {
            if (previous === undefined) delete process.env[key];
            else process.env[key] = previous;
        });
    }

    let storedUser;
    const repository = {
        create: input => input,
        async save(input) {
            if (storedUser) {
                throw new QueryFailedError('INSERT', [], Object.assign(new Error(), { code: 'ER_DUP_ENTRY' }));
            }
            storedUser = { ...input, id: 1, suspendedAt: null };
            return storedUser;
        },
        async findOne({ where, select }) {
            if (!storedUser || !Object.entries(where).every(([key, value]) => storedUser[key] === value)) return null;
            return Object.fromEntries(Object.keys(select).map(key => [key, storedUser[key]]));
        },
        async update(criteria, changes) {
            assert.deepEqual(criteria, { id: 1, hashedPassword: storedUser.hashedPassword });
            Object.assign(storedUser, changes);
            return { affected: 1 };
        }
    };
    t.mock.method(db, 'getRepository', entity => {
        assert.equal(entity, UserEntity);
        return repository;
    });
    const onDuplicate = t.mock.fn();
    eventEmitter.on(USER_EVENTS.USER_SIGNUP_DUPLICATE, onDuplicate);
    t.after(() => eventEmitter.off(USER_EVENTS.USER_SIGNUP_DUPLICATE, onDuplicate));

    const startSession = t.mock.fn(async () => {});
    const issueRefreshToken = createIssueRefreshTokenUseCase({ startSession }, nodeTokenSecurityGateway);
    const createUser = makeCreateUserUseCase(typeormUserGateway, bcryptPasswordHasherGateway);
    const login = createLoginUseCase(typeormUserGateway, bcryptPasswordHasherGateway, nodeTokenSecurityGateway, issueRefreshToken);
    const changePassword = createChangePasswordUseCase(typeormUserPasswordGateway, bcryptPasswordHasherGateway);
    const input = { name: 'Martin', firstname: 'Camille', email: 'camille@example.test', password: 'mot-de-passe-test' };

    await createUser(input);
    assert.equal(await bcryptPasswordHasherGateway.verify(input.password, storedUser.hashedPassword), true);
    await createUser(input);
    assert.deepEqual(onDuplicate.mock.calls.map(call => call.arguments), [[input.email]]);

    const result = await login({ email: input.email, password: input.password });
    assert.deepEqual(result.user, { id: 1, name: input.name, firstname: input.firstname });
    const claims = verifyAccessToken(result.accessToken);
    const [session] = startSession.mock.calls[0].arguments;
    assert.equal(claims.sub, 1);
    assert.equal(claims.sid, session.sessionId);
    assert.equal(session.hashedToken, nodeTokenSecurityGateway.hashRefreshToken(result.refreshToken));

    const newPassword = 'nouveau-mot-de-passe-test';
    await changePassword(1, { oldPassword: input.password, newPassword });
    await assert.rejects(login({ email: input.email, password: input.password }), { errorid: 'AUTH_001' });
    assert.equal((await login({ email: input.email, password: newPassword })).user.id, 1);
});
