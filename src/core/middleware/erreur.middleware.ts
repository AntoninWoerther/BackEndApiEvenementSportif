import type { ErrorRequestHandler } from 'express';
import { AppError } from '../http/error.response';

const normalizeRequestError = (error: unknown): AppError | undefined => {
    if (error instanceof AppError) {
        return error;
    }

    if (!(error instanceof Error)) {
        return;
    }

    if (error instanceof URIError && 'status' in error && error.status === 400) {
        return new AppError('L’URL de la requête est mal encodée.', 400, 'ERR_INVALID_URL');
    }

    const type = 'type' in error ? error.type : undefined;
    switch (type) {
        case 'entity.parse.failed':
            return new AppError('Le corps de la requête doit être un JSON valide.', 400, 'ERR_VALI_400');
        case 'entity.too.large':
            return new AppError('Le corps de la requête est trop volumineux.', 413, 'ERR_BODY_TOO_LARGE');
        case 'charset.unsupported':
        case 'encoding.unsupported':
            return new AppError('L’encodage du corps de la requête est incompatible.', 415, 'ERR_BODY_ENCODING');
        case 'request.size.invalid':
        case 'request.aborted':
            return new AppError('Le corps de la requête est incomplet ou invalide.', 400, 'ERR_VALI_400');
    }

    if ('expose' in error && error.expose === true && 'status' in error && error.status === 400) {
        return new AppError('La requête est invalide.', 400, 'ERR_VALI_400');
    }
};

export const errorMiddleware: ErrorRequestHandler = (error: unknown, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    let appError = normalizeRequestError(error);
    if (!appError) {
        // Log the call stack without copying request data or SQL parameters from error messages.
        console.error('Unhandled request error', {
            method: req.method,
            route: req.route?.path,
            name: error instanceof Error ? error.name : typeof error,
            code: error instanceof Error && 'code' in error ? error.code : undefined,
            stack: error instanceof Error
                ? error.stack?.split('\n').filter(line => line.trimStart().startsWith('at ')).join('\n')
                : undefined
        });

        appError = new AppError('Erreur interne du serveur.', 500, 'err-00-500');
    }

    return res.status(appError.statusCode).json(appError.toJson());
};
