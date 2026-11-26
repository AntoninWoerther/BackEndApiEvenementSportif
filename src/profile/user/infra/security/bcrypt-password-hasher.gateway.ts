import bcrypt from 'bcryptjs';
import type { PasswordHasherGateway } from '../../app/interfaces/password-hasher.gateway';

export const bcryptPasswordHasherGateway: PasswordHasherGateway = {
    hash: password => bcrypt.hash(password, 10),
    verify: (password, hash) => bcrypt.compare(password, hash)
};
