import type { ValidationError } from 'class-validator';
import { AppError } from './app.error';

export class ValidationFailedError extends AppError {

    constructor(errors: ValidationError[]) {

        const fields = errors.map(error => ({
            field: error.property,
            constraints: Object.entries(error.constraints ?? {}).map(
                ([constraint, message]) => ({
                    constraint,
                    message
                })
            )
        }));

        super(
            'Les données envoyées sont invalides.',
            'ERR_VALI_400',
            { fields }
        );
    }
}