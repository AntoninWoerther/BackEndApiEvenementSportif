export interface Evenement {
    id: number;
    description: string;
    location: string;
    date: string;
    capacity: number;
    creatorId: number | null;
}

export interface EvenementWithAvailability extends Evenement {
    remainingPlaces: number;
}
