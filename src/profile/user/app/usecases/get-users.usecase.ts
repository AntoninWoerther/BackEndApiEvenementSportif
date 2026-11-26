import type { UserProfile } from '../../domain/user-profile';
import type { UserGateway } from '../interfaces/user.gateway';

export type GetUsersUseCase = () => Promise<UserProfile[]>;

export const makeGetUsersUseCase = (users: Pick<UserGateway, 'list'>): GetUsersUseCase => {
    return () => users.list();
};
