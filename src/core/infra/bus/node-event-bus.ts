import { EventEmitter } from 'node:events';
import type { EventPublisher, EventSubscriber } from '../../bus/event-bus';

export const makeNodeEventBus = <Events extends object>(): EventPublisher<Events> & EventSubscriber<Events> => {
    const emitter = new EventEmitter();

    return {
        publish(name, payload) {
            emitter.emit(name, payload);
        },
        subscribe(name, listener) {
            emitter.on(name, listener);
        }
    };
};
