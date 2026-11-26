import { AppError } from "../../../../core/http/error.response";


export class UserNotFound extends AppError {
    constructor() {
        super(
            'User not found.',
            404,
            'USER_001'
        );
    }
}