import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import type { CreateEvenementInput } from '../../app/inputs/create-evenement.input';
import { EvenementDateDto } from './evenement-date.dto';

export class CreateEvenementDto extends EvenementDateDto implements CreateEvenementInput {
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    description!: string;

    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    location!: string;

    @IsInt()
    @Min(1)
    @Max(2147483647)
    capacity!: number;
}
