type EventName<Events> = Extract<keyof Events, string>;

export interface EventPublisher<Events extends object> {
    publish<Name extends EventName<Events>>(name: Name, payload: Events[Name]): void;
}

export interface EventSubscriber<Events extends object> {
    subscribe<Name extends EventName<Events>>(
        name: Name,
        listener: (payload: Events[Name]) => void | Promise<void>
    ): void;
}
