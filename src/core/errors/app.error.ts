export class AppError extends Error {
    constructor(message: string, public readonly errorid: string, public readonly meta?: Record<string, unknown>) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
