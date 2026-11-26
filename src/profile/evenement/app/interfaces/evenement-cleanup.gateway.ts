export interface EvenementToWarn {
    id: number;
    date: string;
    creatorId: number;
    creatorEmail: string;
}

export interface EvenementCleanupGateway {
    deleteExpired(lastExpiredDate: string): Promise<number>;
    findToWarn(firstDate: string, lastDate: string): Promise<EvenementToWarn[]>;
    markWarningSent(evenement: EvenementToWarn, sentAt: Date): Promise<boolean>;
}
