import type { UserGateway } from '../../../profile/user/app/interfaces/user.gateway';
import type { UserProfile } from '../../../profile/user/domain/user-profile';

export type GetAuthenticatedUserUseCase = (userId: number) => Promise<UserProfile | null>;

export const makeGetAuthenticatedUserUseCase = (
    users: Pick<UserGateway, 'findById'>
): GetAuthenticatedUserUseCase => {
    return userId => users.findById(userId);
};
