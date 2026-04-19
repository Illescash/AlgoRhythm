export type VisualEvent =
    | { type: 'SET'; index: number; value: number }  // Escritura individual al array
    | { type: 'COMPARE'; indices: [number, number] } // Comparación de dos posiciones
    | { type: 'INITIALIZE'; data?: number[] }        // Carga inicial de datos
    | { type: 'DONE' };                              // Algoritmo finalizado

class EventBus {
    private listeners: ((event: VisualEvent) => void)[] = [];

    subscribe(callback: (event: VisualEvent) => void) {
        this.listeners.push(callback);

        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    emit(event: VisualEvent) {
        this.listeners.forEach(l => l(event));
    }
}

export const eventBus = new EventBus();
