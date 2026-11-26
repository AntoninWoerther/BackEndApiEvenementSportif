import type { Evenement } from '../../domain/evenement';

export type CreateEvenementInput = Pick<Evenement, 'description' | 'location' | 'date' | 'capacity'>;
