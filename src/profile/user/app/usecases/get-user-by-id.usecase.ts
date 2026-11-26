import { UserNotFound } from '../../domain/errors/user-not-found.error';
import type { UserProfile } from '../../domain/user-profile';
import type { UserGateway } from '../interfaces/user.gateway';

export type GetUserByIdUseCase = (id: number) => Promise<UserProfile>;

export const makeGetUserByIdUseCase = (users: Pick<UserGateway, 'findById'>): GetUserByIdUseCase => {
    return async id => {
        const user = await users.findById(id);
        if (!user) {
            throw new UserNotFound();
        }

        return user;
    };
};
