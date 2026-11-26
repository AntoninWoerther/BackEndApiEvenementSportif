import type { PasswordHasherGateway } from '../../../profile/user/app/interfaces/password-hasher.gateway';
import type { UserGateway } from '../../../profile/user/app/interfaces/user.gateway';
import { AccountSuspendedError } from '../../../profile/user/domain/errors/account-suspended.error';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import type { LoginInput } from '../inputs/login.input';
import type { TokenSecurityGateway } from '../interfaces/token-security.gateway';
import type { IssueRefreshTokenUseCase } from './create-refresh-token.usecase';

export const createLoginUseCase = (
    users: Pick<UserGateway, 'findByEmail'>,
    passwords: Pick<PasswordHasherGateway, 'verify'>,
    tokens: Pick<TokenSecurityGateway, 'createSessionId' | 'signAccessToken'>,
    issueRefreshToken: IssueRefreshTokenUseCase
) => {
    return async (credentials: LoginInput) => {
        const user = await users.findByEmail(credentials.email);
        if (!user || !(await passwords.verify(credentials.password, user.hashedPassword))) {
            throw new InvalidCredentialsError();
        }
        if (user.suspendedAt) {
            throw new AccountSuspendedError();
        }

        const { id, name, firstname } = user;
        const sessionId = tokens.createSessionId();
        const accessToken = tokens.signAccessToken(id, sessionId);
        const refreshToken = await issueRefreshToken(id, sessionId);

        return { user: { id, name, firstname }, accessToken, refreshToken };
    };
};

export type LoginUseCase = ReturnType<typeof createLoginUseCase>;
