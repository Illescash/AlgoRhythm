export type VisualEvent =
    | { type: 'SWAP'; indices: [number, number] }
    | { type: 'COMPARE'; indices: [number, number] }
    | { type: 'INITIALIZE'; data?: number[] };

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
