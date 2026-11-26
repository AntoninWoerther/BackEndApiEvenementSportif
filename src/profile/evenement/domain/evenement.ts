export interface Evenement {
    id: number;
    description: string;
    location: string;
    date: string;
    capacity: number;
    creatorId: number | null;
    cancelledAt: Date | null;
    cancellationReason: string | null;
}

export interface EvenementWithAvailability extends Evenement {
    remainingPlaces: number;
}
