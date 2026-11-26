import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import type { UpdateEvenementDetailsInput } from '../../app/inputs/update-evenement-details.input';

export class UpdateEvenementDetailsDto implements UpdateEvenementDetailsInput {
    @ValidateIf((_object, value) => value !== undefined)
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    description?: string;

    @ValidateIf((_object, value) => value !== undefined)
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    location?: string;

    @ValidateIf((_object, value) => value !== undefined)
    @IsInt()
    @Min(1)
    @Max(2147483647)
    capacity?: number;
}
