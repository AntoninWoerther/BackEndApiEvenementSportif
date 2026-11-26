import assert from 'node:assert/strict';
import { test } from 'node:test';
import { db } from '../src/core/dataBase.config.ts';
import { makeChangeUserPermissionUseCase } from '../src/profile/user/app/usecases/change-user-permission.usecase.ts';
import { DEFAULT_USER_PERMISSIONS, hasUserPermission, USER_PERMISSIONS } from '../src/profile/user/domain/permissions/user.permissions.ts';
import { UserEntity } from '../src/profile/user/infra/persistance/entities/user.entity.ts';
import { UserPermissionChangeEntity } from '../src/profile/user/infra/persistance/entities/user-permission-change.entity.ts';
import { typeormUserPermissionsGateway } from '../src/profile/user/infra/persistance/repositories/typeorm-user-permissions.gateway.ts';

const grant = makeChangeUserPermissionUseCase(typeormUserPermissionsGateway, 'grant');
const revoke = makeChangeUserPermissionUseCase(typeormUserPermissionsGateway, 'revoke');
const { SUPERUSER, UPDATE_OTHER_EVENTS, SUSPEND_ACCOUNT, REACTIVATE_ACCOUNT } = USER_PERMISSIONS;
const superuserId = 1;
const userId = 2;
const anotherUserId = 3;

function seedUsers(t) {
    const permissions = new Map([
        [superuserId, SUPERUSER],
        [userId, DEFAULT_USER_PERMISSIONS],
        [anotherUserId, DEFAULT_USER_PERMISSIONS]
    ]);
    const changes = [];
    const repositories = new Map([
        [UserEntity, {
            createQueryBuilder() {
                let ids;
                return {
                    select() { return this; },
                    where(_query, params) {
                        ids = params.ids;
                        return this;
                    },
                    orderBy() { return this; },
                    setLock() { return this; },
                    async getMany() {
                        return ids.filter(id => permissions.has(id)).map(id => ({ id, permissions: permissions.get(id) }));
                    }
                };
            },
            async update(id, values) {
                permissions.set(id, values.permissions);
            }
        }],
        [UserPermissionChangeEntity, { async insert(change) { changes.push(change); } }]
    ]);
    t.mock.method(db, 'transaction', run => run({ getRepository: entity => repositories.get(entity) }));

    return { permissions, changes };
}

test('le superadmin ajoute et retire un droit en préservant les autres droits et en journalisant les changements', async t => {
    const { permissions, changes } = seedUsers(t);
    const augmented = DEFAULT_USER_PERMISSIONS | UPDATE_OTHER_EVENTS;
    assert.equal(hasUserPermission(DEFAULT_USER_PERMISSIONS, UPDATE_OTHER_EVENTS), false);

    assert.equal(await grant(superuserId, userId, UPDATE_OTHER_EVENTS), augmented);
    assert.equal(await grant(superuserId, userId, UPDATE_OTHER_EVENTS), augmented);
    assert.equal(permissions.get(userId), augmented);
    assert.equal(hasUserPermission(permissions.get(userId), UPDATE_OTHER_EVENTS), true);

    assert.equal(await revoke(superuserId, userId, UPDATE_OTHER_EVENTS), DEFAULT_USER_PERMISSIONS);
    assert.equal(await revoke(superuserId, userId, UPDATE_OTHER_EVENTS), DEFAULT_USER_PERMISSIONS);
    assert.equal(permissions.get(userId), DEFAULT_USER_PERMISSIONS);

    assert.deepEqual(changes, [
        { actorId: superuserId, userId, previousPermissions: DEFAULT_USER_PERMISSIONS, newPermissions: augmented },
        { actorId: superuserId, userId, previousPermissions: augmented, newPermissions: DEFAULT_USER_PERMISSIONS }
    ]);
});

test('un utilisateur ordinaire ne peut pas modifier les permissions d’un autre compte', async t => {
    const { permissions, changes } = seedUsers(t);

    await assert.rejects(grant(userId, anotherUserId, UPDATE_OTHER_EVENTS), {
        errorid: 'AUTH_006'
    });
    await assert.rejects(revoke(userId, anotherUserId, USER_PERMISSIONS.UPDATE_EVENT), {
        errorid: 'AUTH_006'
    });
    assert.equal(permissions.get(anotherUserId), DEFAULT_USER_PERMISSIONS);
    assert.deepEqual(changes, []);
});

test('la suspension et la réactivation restent réservées au superadmin', async t => {
    const { permissions, changes } = seedUsers(t);

    for (const permission of [SUSPEND_ACCOUNT, REACTIVATE_ACCOUNT]) {
        assert.equal(hasUserPermission(SUPERUSER, permission), true);
        assert.equal(hasUserPermission(DEFAULT_USER_PERMISSIONS | permission, permission), false);
    }
    for (const permission of [SUPERUSER, SUSPEND_ACCOUNT, REACTIVATE_ACCOUNT]) {
        await assert.rejects(grant(superuserId, userId, permission), {
            errorid: 'USER_006'
        });
    }
    assert.equal(permissions.get(userId), DEFAULT_USER_PERMISSIONS);
    assert.deepEqual(changes, []);
});
