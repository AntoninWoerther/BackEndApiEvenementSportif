import { randomUUID } from 'node:crypto';
import { AccountSuspendedError } from '../../../profile/user/domain/errors/account-suspended.error';
import * as userRepository from '../../../profile/user/infra/persistance/repositories/user.repository';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { getJwtSecret, signAccessToken } from '../../infra/security/access-token.security';
import { verifyPassword } from '../../infra/security/password.security';
import type { LoginInput } from '../inputs/login.input';
import type { IssueRefreshTokenUseCase } from './create-refresh-token.usecase';

export const createLoginUseCase = (issueRefreshToken: IssueRefreshTokenUseCase) => {
    return async (credentials: LoginInput) => {
        const user = await userRepository.findUserByEmail(credentials.email);

        if (!user) {
            throw new InvalidCredentialsError();
        }

        if (!(await verifyPassword(credentials.password, user.hashedPassword))) {
            throw new InvalidCredentialsError();
        }

        if (user.suspendedAt) {
            throw new AccountSuspendedError();
        }

        const sessionId = randomUUID();
        const accessToken = signAccessToken(user.id, getJwtSecret(), sessionId);
        const refreshToken = await issueRefreshToken(user.id, sessionId);

        return { user, accessToken, refreshToken };
    };
};

export type LoginUseCase = ReturnType<typeof createLoginUseCase>;
