import { startHourlyCleanup } from '../../../../core/scheduling/hourly-cleanup';
import type { CleanupEvenementsUseCase } from '../../app/usecases/cleanup-evenements.usecase';

export const startEvenementCleanupScheduler = (cleanupEvenements: CleanupEvenementsUseCase): void => {
    startHourlyCleanup(cleanupEvenements, {
        deleted: count => `[EVENEMENTS] Événements expirés supprimés : ${count}.`,
        failed: '[EVENEMENTS] Le nettoyage des événements a échoué.'
    });
};
