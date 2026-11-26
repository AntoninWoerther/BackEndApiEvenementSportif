import { IsDateString, Matches } from 'class-validator';

export class EvenementDateDto {
    @Matches(/^[1-9]\d{3}-\d{2}-\d{2}$/, { message: 'La date doit être au format AAAA-MM-JJ.' })
    @IsDateString({ strict: true }, { message: 'La date doit être un jour valide.' })
    date!: string;
}
