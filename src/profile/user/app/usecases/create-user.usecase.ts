import { eventEmitter } from '../../../../core/bus/event.emiter';
import { UserEmailAlreadyExists } from '../../domain/errors/user-email-already-exists.error';
import { USER_EVENTS } from '../../domain/events/user.events';
import type { CreateUserInput } from '../inputs/create-user.input';
import type { PasswordHasherGateway } from '../interfaces/password-hasher.gateway';
import type { UserGateway } from '../interfaces/user.gateway';

export type CreateUserUseCase = (input: CreateUserInput) => Promise<void>;

export const makeCreateUserUseCase = (
    users: Pick<UserGateway, 'create'>,
    passwords: Pick<PasswordHasherGateway, 'hash'>
): CreateUserUseCase => {
    return async ({ name, firstname, email, password }) => {
        const hashedPassword = await passwords.hash(password);
        try {
            const user = await users.create({ name, firstname, email, hashedPassword });
            eventEmitter.emit(USER_EVENTS.USER_CREATED, user.email);
        } catch (error) {
            if (!(error instanceof UserEmailAlreadyExists)) {
                throw error;
            }

            eventEmitter.emit(USER_EVENTS.USER_SIGNUP_DUPLICATE, email);
        }
    };
};
