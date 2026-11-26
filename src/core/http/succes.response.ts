export class ReponseApp<T>{
    constructor(
        public readonly data: T,
        public readonly meta?: T
    )
    {}
}