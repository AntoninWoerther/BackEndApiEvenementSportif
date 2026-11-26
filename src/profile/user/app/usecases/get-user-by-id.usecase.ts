import { UserNotFound } from '../../domain/errors/user-not-found.error';
import { findUserById } from '../../infra/persistance/repositories/user.repository';

export const getUserByIdUseCase = async (id: number) => {

    const user = await findUserById(id);

    if (!user) {
        throw new UserNotFound();
    }

    return user;
};
