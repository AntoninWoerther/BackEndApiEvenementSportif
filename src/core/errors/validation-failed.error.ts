import { ValidationError } from 'class-validator';
import { AppError } from '../http/error.response';

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
            400,
            'ERR_VALI_400',
            { fields }
        );
    }
}