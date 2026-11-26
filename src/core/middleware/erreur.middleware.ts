import type { ErrorRequestHandler } from 'express';
import { AppError } from '../http/error.response';

export const errorMiddleware: ErrorRequestHandler = (error: unknown, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof AppError) {
        return res.status(error.statusCode).json(error.toJson());
    }

    if (error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed') {
        const invalidJson = new AppError('Le corps de la requête doit être un JSON valide.', 400, 'ERR_VALI_400');
        return res.status(invalidJson.statusCode).json(invalidJson.toJson());
    }

    if (error instanceof Error && 'type' in error && error.type === 'entity.too.large') {
        const tooLarge = new AppError('Le corps de la requête est trop volumineux.', 413, 'ERR_BODY_TOO_LARGE');
        return res.status(tooLarge.statusCode).json(tooLarge.toJson());
    }

    if (error instanceof URIError && 'status' in error && error.status === 400) {
        const invalidUrl = new AppError('L’URL de la requête est mal encodée.', 400, 'ERR_INVALID_URL');
        return res.status(invalidUrl.statusCode).json(invalidUrl.toJson());
    }

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

    const errorUnknow = new AppError('Internal serveur Error', 500, 'err-00-500');
    res.status(errorUnknow.statusCode).json(errorUnknow.toJson());
};
