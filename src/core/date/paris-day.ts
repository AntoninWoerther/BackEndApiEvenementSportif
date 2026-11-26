const parisDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

export const formatParisDay = (now: Date): string => {
    const parts = Object.fromEntries(parisDateFormatter.formatToParts(now).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
};
