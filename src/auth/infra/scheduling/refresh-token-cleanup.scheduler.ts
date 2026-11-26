import { startHourlyCleanup } from '../../../core/scheduling/hourly-cleanup';
import type { CleanupRefreshTokensUseCase } from '../../app/usecases/cleanup-refresh-tokens.usecase';

export const startRefreshTokenCleanupScheduler = (cleanupRefreshTokens: CleanupRefreshTokensUseCase): void => {
    startHourlyCleanup(cleanupRefreshTokens, {
        deleted: count => `[AUTH] Jetons de renouvellement expirés supprimés : ${count}.`,
        failed: '[AUTH] Le nettoyage des jetons de renouvellement a échoué.'
    });
};
