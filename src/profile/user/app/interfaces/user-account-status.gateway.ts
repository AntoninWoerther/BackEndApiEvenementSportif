import type { UserAccountStatusAction } from '../../domain/user-account-status';

export type ChangeUserAccountStatusResult = 'applied' | 'forbidden' | 'actor-not-found' | 'user-not-found';

export interface UserAccountStatusGateway {
    changeStatus(actorId: number, userId: number, action: UserAccountStatusAction): Promise<ChangeUserAccountStatusResult>;
}
