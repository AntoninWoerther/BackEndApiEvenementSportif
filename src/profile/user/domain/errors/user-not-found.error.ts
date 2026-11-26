import { AppError } from "../../../../core/errors/app.error";


export class UserNotFound extends AppError {
    constructor() {
        super(
            'Utilisateur introuvable.',
            'USER_001'
        );
    }
}