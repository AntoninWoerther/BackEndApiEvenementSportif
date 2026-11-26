import { IsByteLength, IsNotEmpty, IsString, MinLength } from 'class-validator';
import type { ChangePasswordInput } from '../../app/inputs/change-password.input';

export class ChangePasswordDto implements ChangePasswordInput {
    @IsString()
    @IsNotEmpty()
    oldPassword!: string;

    @IsString()
    @MinLength(8)
    @IsByteLength(0, 72, { message: 'Le nouveau mot de passe doit contenir au maximum 72 octets.' })
    newPassword!: string;
}
