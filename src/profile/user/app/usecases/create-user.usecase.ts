import { eventEmitter } from '../../../../core/bus/event.emiter';
import { UserEmailAlreadyExists } from '../../domain/errors/user-email-already-exists.error';
import { USER_EVENTS } from '../../domain/events/user.events';
import { createNewUsers } from '../../infra/persistance/repositories/user.repository';
import { hashPassword } from '../../infra/security/password.security';
import type { CreateUserInput } from '../inputs/create-user.input';

export const createUserUseCase = async (
    userToCreate: CreateUserInput
): Promise<void> => {

    // 1. Hasher le mot de passe
    const hashedPassword = await hashPassword(userToCreate.password);

    // 2. Préparer les données destinées à la base
    const inputUser = {
        name: userToCreate.name,
        firstname: userToCreate.firstname,
        email: userToCreate.email,
        hashedPassword
    };

    try {
        const newUser = await createNewUsers(inputUser);
        eventEmitter.emit(USER_EVENTS.USER_CREATED, newUser.email);
    } catch (error) {
        if (!(error instanceof UserEmailAlreadyExists)) {
            throw error;
        }

        eventEmitter.emit(USER_EVENTS.USER_SIGNUP_DUPLICATE, inputUser.email);
    }
};
