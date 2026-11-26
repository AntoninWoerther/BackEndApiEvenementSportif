const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

interface CleanupMessages {
    deleted(count: number): string;
    failed: string;
}

export const startHourlyCleanup = (cleanup: () => Promise<number>, messages: CleanupMessages): void => {
    let running = false;

    const run = async (): Promise<void> => {
        if (running) {
            return;
        }

        running = true;
        try {
            const deleted = await cleanup();
            if (deleted > 0) {
                console.log(messages.deleted(deleted));
            }
        } catch (error) {
            console.error(messages.failed, error);
        } finally {
            running = false;
        }
    };

    void run();
    setInterval(run, CLEANUP_INTERVAL_MS).unref();
};
