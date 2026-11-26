import type { UserProfile } from '../../domain/user-profile';
import type { CreateUserInput } from '../inputs/create-user.input';

export type NewUserRecord = Omit<CreateUserInput, 'password'> & { hashedPassword: string };

export interface UserCredentials extends UserProfile {
    email: string;
    hashedPassword: string;
    suspendedAt: Date | null;
}

export interface UserGateway {
    create(input: NewUserRecord): Promise<{ email: string }>;
    list(): Promise<UserProfile[]>;
    findById(id: number): Promise<UserProfile | null>;
    findByEmail(email: string): Promise<UserCredentials | null>;
    deleteById(id: number): Promise<string | null>;
}
