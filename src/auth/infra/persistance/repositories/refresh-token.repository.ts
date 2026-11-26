
import { LessThanOrEqual } from 'typeorm';
import type { DeepPartial } from 'typeorm';
import { db } from '../../../../core/dataBase.config';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export const createRefreshToken = async (
    refreshToken: DeepPartial<RefreshTokenEntity>
): Promise<RefreshTokenEntity> => {

    const repository = db.getRepository(RefreshTokenEntity);

    const newRefreshToken = repository.create(refreshToken);

    return repository.save(newRefreshToken);
};


export const findRefreshTokenByHash = async (
    hashedToken: string
): Promise<RefreshTokenEntity | null> => {

    const repository = db.getRepository(RefreshTokenEntity);

    return repository.findOne({
        where: { hashedToken },
        relations: { user: true }
    });
};


export const revokeRefreshToken = async (
    id: number
): Promise<void> => {

    const repository = db.getRepository(RefreshTokenEntity);

    await repository.update(
        { id },
        { revokedAt: new Date() }
    );
};

export const deleteExpiredRefreshTokens = async (now: Date): Promise<number> => {
    const result = await db.getRepository(RefreshTokenEntity).delete({
        expiresAt: LessThanOrEqual(now)
    });

    return result.affected ?? 0;
};
