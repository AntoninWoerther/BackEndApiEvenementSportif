import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength
} from 'class-validator';

export class UserToCreateDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    firstname!: string;

    @IsEmail()
    @MaxLength(100)
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;
}