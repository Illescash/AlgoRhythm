import { eventBus, type VisualEvent } from './eventBus';

/**
 * Este es el "Event Listener" definitivo de tu diagrama.
 * Se encarga de recibir mensajes del Web Worker y empujarlos al EventBus.
 */
export const initWorkerBridge = (worker: Worker) => {
    worker.onmessage = (event: MessageEvent<VisualEvent>) => {
        eventBus.emit(event.data);
    };

    console.log('🏗️ Worker Bridge Initialized');
};

/**
 * Función dummy para simular la llegada de un mensaje del worker
 * Útil para pruebas desde la terminal o consola.
 */
export const simulateWorkerMessage = (data: VisualEvent) => {
    eventBus.emit(data);
};
