import { AppError } from "../../../../core/http/error.response";


export class UserNotFound extends AppError {
    constructor() {
        super(
            'Utilisateur introuvable.',
            404,
            'USER_001'
        );
    }
}