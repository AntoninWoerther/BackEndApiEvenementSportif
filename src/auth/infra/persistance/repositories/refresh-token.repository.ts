import { IsNull, LessThanOrEqual, MoreThan } from 'typeorm';
import type { EntityManager, Repository } from 'typeorm';
import { db } from '../../../../core/dataBase.config';
import { UserEntity } from '../../../../profile/user/infra/persistance/entities/user.entity';
import type { LogoutResult, RefreshTokenToSave } from '../../../app/interfaces/refresh-token.gateway';
import { InvalidCredentialsError } from '../../../domain/errors/invalid-credentials.error';
import { AUTH_SESSION_EVENTS } from '../../../domain/events/auth-session.events';
import type { AuthSessionEventType } from '../../../domain/events/auth-session.events';
import { AuthSessionEventEntity } from '../entities/auth-session-event.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

const lockUser = async (manager: EntityManager, userId: number): Promise<boolean> => {
    const user = await manager.getRepository(UserEntity).findOne({
        where: { id: userId },
        select: { id: true },
        lock: { mode: 'pessimistic_write' }
    });

    return user !== null;
};

const insertRefreshToken = async (repository: Repository<RefreshTokenEntity>, token: RefreshTokenToSave): Promise<void> => {
    await repository.insert({ ...token, revokedAt: null });
};

const recordSessionEvent = async (
    manager: EntityManager,
    userId: number,
    sessionId: string | null,
    eventType: AuthSessionEventType
): Promise<void> => {
    await manager.getRepository(AuthSessionEventEntity).insert({ userId, sessionId, eventType });
};

const activeRefreshTokenCriteria = (now: Date) => ({
    revokedAt: IsNull(),
    expiresAt: MoreThan(now)
});

export const startRefreshSession = (token: RefreshTokenToSave): Promise<void> => {
    return db.transaction(async (manager) => {
        if (!(await lockUser(manager, token.userId))) {
            throw new InvalidCredentialsError();
        }

        await insertRefreshToken(manager.getRepository(RefreshTokenEntity), token);
        await recordSessionEvent(manager, token.userId, token.sessionId, AUTH_SESSION_EVENTS.LOGIN);
    });
};

export const findRefreshTokenByHash = (hashedToken: string): Promise<RefreshTokenEntity | null> => {
    return db.getRepository(RefreshTokenEntity).findOne({ where: { hashedToken } });
};

export const rotateRefreshToken = (id: number, replacement: RefreshTokenToSave): Promise<boolean> => {
    return db.transaction(async (manager) => {
        if (!(await lockUser(manager, replacement.userId))) {
            return false;
        }

        const repository = manager.getRepository(RefreshTokenEntity);
        const now = new Date();
        const result = await repository.update(
            { id, userId: replacement.userId, ...activeRefreshTokenCriteria(now) },
            { revokedAt: now, sessionId: replacement.sessionId }
        );
        if (result.affected !== 1) {
            return false;
        }

        await insertRefreshToken(repository, replacement);
        return true;
    });
};

export const revokeRefreshSessionByHash = async (hashedToken: string): Promise<LogoutResult> => {
    const storedToken = await findRefreshTokenByHash(hashedToken);
    if (!storedToken || storedToken.userId === null) {
        return 'invalid';
    }
    if (storedToken.expiresAt.getTime() <= Date.now()) {
        return 'expired';
    }

    const userId = storedToken.userId;
    return db.transaction<LogoutResult>('READ COMMITTED', async (manager) => {
        if (!(await lockUser(manager, userId))) {
            return 'invalid';
        }

        const repository = manager.getRepository(RefreshTokenEntity);
        const token = await repository.findOne({ where: { hashedToken, userId } });
        const now = new Date();
        if (!token) {
            return 'invalid';
        }
        if (token.expiresAt <= now) {
            return 'expired';
        }

        const sessionCriteria = token.sessionId === null ? { id: token.id } : { sessionId: token.sessionId };
        const result = await repository.update(
            { userId, ...sessionCriteria, ...activeRefreshTokenCriteria(now) },
            { revokedAt: now }
        );
        if ((result.affected ?? 0) === 0) {
            return 'inactive';
        }

        await recordSessionEvent(manager, userId, token.sessionId, AUTH_SESSION_EVENTS.LOGOUT);
        return 'logged-out';
    });
};

export const revokeAllRefreshSessions = (userId: number): Promise<void> => {
    return db.transaction(async (manager) => {
        if (!(await lockUser(manager, userId))) {
            return;
        }

        const now = new Date();
        const result = await manager.getRepository(RefreshTokenEntity).update(
            { userId, ...activeRefreshTokenCriteria(now) },
            { revokedAt: now }
        );
        if ((result.affected ?? 0) > 0) {
            await recordSessionEvent(manager, userId, null, AUTH_SESSION_EVENTS.LOGOUT_ALL);
        }
    });
};

export const hasActiveRefreshSession = (userId: number, sessionId: string): Promise<boolean> => {
    return db.getRepository(RefreshTokenEntity).existsBy({
        userId,
        sessionId,
        ...activeRefreshTokenCriteria(new Date())
    });
};

export const deleteExpiredRefreshTokens = async (now: Date): Promise<number> => {
    const result = await db.getRepository(RefreshTokenEntity).delete({ expiresAt: LessThanOrEqual(now) });
    return result.affected ?? 0;
};
