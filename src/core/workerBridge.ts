import { eventBus, type VisualEvent } from './eventBus';

export const initWorkerBridge = (worker: Worker) => {
    worker.onmessage = (event: MessageEvent<VisualEvent>) => {
        eventBus.emit(event.data);
    };
};
