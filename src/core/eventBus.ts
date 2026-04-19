export type VisualEvent =
    | { type: 'SET'; index: number; value: number }        // Escritura individual al array
    | { type: 'COMPARE'; indices: [number, number] }       // Comparación de dos posiciones
    | { type: 'INITIALIZE'; data?: number[] }              // Carga inicial de datos
    | { type: 'DONE' }                                     // Sort finalizado
    | { type: 'FOUND'; index: number }                     // Search: target localizado
    | { type: 'NOT_FOUND' }                                // Search: target no está en el array
    | { type: 'RANGE'; low: number; high: number };        // Search: rango activo (binary/jump/interpolation)

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
