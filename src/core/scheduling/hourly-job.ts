const HOURLY_INTERVAL_MS = 60 * 60 * 1000;

export const startHourlyJob = (job: () => Promise<void>, failureMessage: string): void => {
    let running = false;

    const run = async (): Promise<void> => {
        if (running) {
            return;
        }

        running = true;
        try {
            await job();
        } catch (error) {
            console.error(failureMessage, error);
        } finally {
            running = false;
        }
    };

    void run();
    setInterval(run, HOURLY_INTERVAL_MS).unref();
};
