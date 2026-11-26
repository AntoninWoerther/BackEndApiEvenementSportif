export class AppError extends Error {

    constructor(message: string, public readonly statusCode: number, public readonly errorid: string, public readonly meta?: Record<string, unknown>) {
        super(message);

        this.name = this.constructor.name;

        Object.setPrototypeOf(this, new.target.prototype);
    }

    toJson(){
        return {
            statusCode: this.statusCode,
            idcode: this.errorid,
            message: this.message,
            ...(this.meta && { fields: this.meta })
        }
    }
}