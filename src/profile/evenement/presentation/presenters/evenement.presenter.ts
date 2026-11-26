import type { Evenement, EvenementWithAvailability } from '../../domain/evenement';

export const presentEvenement = (evenement: Evenement): Evenement => {
    const { id, description, location, date, capacity, creatorId } = evenement;
    return { id, description, location, date, capacity, creatorId };
};

export const presentEvenementWithAvailability = (evenement: EvenementWithAvailability): EvenementWithAvailability => {
    return { ...presentEvenement(evenement), remainingPlaces: evenement.remainingPlaces };
};
