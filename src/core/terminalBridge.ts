import { eventBus } from './eventBus';

export const initTerminalBridge = () => {
    // 1. Exponer a la consola del navegador (F12)
    (window as any).emitEvent = (event: any) => eventBus.emit(event);

    // 2. Conectar al Bridge de Terminal vía SSE (Server-Sent Events)
    const eventSource = new EventSource('http://localhost:8080/events');

    eventSource.onopen = () => {
        console.log('✅ Terminal Bridge Connected (SSE)');
    };

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            eventBus.emit(data);
        } catch (e) {
            console.error('❌ Invalid event from bridge:', event.data);
        }
    };

    eventSource.onerror = () => {
        // No mostramos error constante porque es normal si el bridge no está corriendo
    };
};
