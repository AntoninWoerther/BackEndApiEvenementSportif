import { presentUser } from '../../../profile/user/presentation/presenters/user.presenter';
import type { LoginUseCase } from '../../app/usecases/login.usecase';
import type { RefreshUseCase } from '../../app/usecases/refresh.usecase';

export const presentAuthTokens = ({ accessToken, refreshToken }: Awaited<ReturnType<RefreshUseCase>>) => {
    return { accessToken, refreshToken };
};

export const presentLogin = (result: Awaited<ReturnType<LoginUseCase>>) => {
    return { user: presentUser(result.user), ...presentAuthTokens(result) };
};
