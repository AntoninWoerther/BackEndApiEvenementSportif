import { db } from '../../dataBase.config';
import { ALL_USER_PERMISSIONS } from '../../../profile/user/domain/permissions/user.permissions';
import { UserEntity } from '../../../profile/user/infra/persistance/entities/user.entity';

const grantSuperuser = async (): Promise<void> => {
    const [rawUserId] = process.argv.slice(2);
    const userId = Number(rawUserId);

    if (typeof rawUserId !== 'string' || !/^\d+$/.test(rawUserId) || !Number.isSafeInteger(userId) || userId <= 0) {
        throw new Error('Usage : npm run grant:superuser -- <id-utilisateur>');
    }

    await db.initialize();
    try {
        const result = await db.getRepository(UserEntity).update(userId, { permissions: ALL_USER_PERMISSIONS });
        if (result.affected !== 1) {
            throw new Error('Utilisateur introuvable.');
        }

        console.log(`Compte ${userId} promu super utilisateur.`);
    } finally {
        await db.destroy();
    }
};

grantSuperuser().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Impossible de promouvoir ce compte.');
    process.exitCode = 1;
});
