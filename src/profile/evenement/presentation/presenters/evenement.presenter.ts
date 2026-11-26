import type { Evenement, EvenementWithAvailability } from '../../domain/evenement';

type PresentedEvenement = Omit<Evenement, 'cancelledAt' | 'cancellationReason'> & { cancelledAt?: Date };

export const presentEvenement = (evenement: Evenement): PresentedEvenement => {
    const { id, description, location, date, capacity, creatorId } = evenement;
    const presented = { id, description, location, date, capacity, creatorId };
    if (evenement.cancelledAt) {
        return { ...presented, description: evenement.cancellationReason ?? description, cancelledAt: evenement.cancelledAt };
    }
    return presented;
};

export const presentEvenementWithAvailability = (evenement: EvenementWithAvailability) => {
    return { ...presentEvenement(evenement), remainingPlaces: evenement.remainingPlaces };
};

export const presentEvenementDateUpdate = (id: number, date: string) => {
    return { id, date, message: 'Date de l’événement modifiée avec succès.' };
};
