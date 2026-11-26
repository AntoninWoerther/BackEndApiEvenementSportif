import { Exclude, Expose, plainToInstance } from 'class-transformer';
import type { UserEntity } from '../../infra/persistance/entities/user.entity';

@Exclude()
export class UserPresenter {

    @Expose()
    id!: number;

    @Expose()
    name!: string;

    @Expose()
    firstname!: string;

    constructor(user: UserEntity) {
        Object.assign(this, user);
    }
}

export const presentUser = (user: UserEntity): UserPresenter => {
    return plainToInstance(UserPresenter, user, {
        excludeExtraneousValues: true
    });
};