import { startHourlyJob } from './hourly-job';

interface CleanupMessages {
    deleted(count: number): string;
    failed: string;
}

export const startHourlyCleanup = (cleanup: () => Promise<number>, messages: CleanupMessages): void => {
    startHourlyJob(async () => {
        const deleted = await cleanup();
        if (deleted > 0) {
            console.log(messages.deleted(deleted));
        }
    }, messages.failed);
};
