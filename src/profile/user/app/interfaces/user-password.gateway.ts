export interface UserPasswordGateway {
    findHashByUserId(userId: number): Promise<string | null>;
    updateHashIfUnchanged(userId: number, currentHash: string, newHash: string): Promise<boolean>;
}
