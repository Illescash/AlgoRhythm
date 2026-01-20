import type { VisualEvent } from '../core/eventBus';

/**
 * Proxy de Datos: Intercepta operaciones en el array para emitir eventos.
 * Implementa una pequeña memoria para emitir comparaciones de dos elementos.
 */
function createDataProxy(array: number[]): number[] {
    let lastAccessedIndex: number | null = null;

    return new Proxy(array, {
        get(target, prop) {
            const value = Reflect.get(target, prop);
            const index = Number(prop);

            if (!isNaN(index)) {
                if (lastAccessedIndex !== null && lastAccessedIndex !== index) {
                    // Si ya teníamos un índice guardado, emitimos la comparación de ambos
                    self.postMessage({
                        type: 'COMPARE',
                        indices: [lastAccessedIndex, index]
                    } as VisualEvent);
                    lastAccessedIndex = null; // Resetear para la siguiente pareja
                } else {
                    // Guardamos este índice para compararlo con el siguiente acceso
                    lastAccessedIndex = index;
                }
            }

            return value;
        },
        set(target, prop, value) {
            // El set lo dejamos silencioso porque emitiremos los SWAP manualmente
            // para tener control total sobre el timing de la animación.
            return Reflect.set(target, prop, value);
        }
    });
}

/**
 * Algoritmo Selection Sort usando el Proxy
 */
async function selectionSort(array: number[]) {
    const n = array.length;

    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;

        for (let j = i + 1; j < n; j++) {
            // La lectura de array[j] y array[minIdx] disparará el evento COMPARE del Proxy
            if (array[j] < array[minIdx]) {
                minIdx = j;
            }
            // Pequeño delay para que la animación sea visible
            await new Promise(r => setTimeout(r, 10));
        }

        if (minIdx !== i) {
            // El intercambio disparará eventos de SET en el Proxy
            [array[i], array[minIdx]] = [array[minIdx], array[i]];

            // Enviamos un SWAP explícito para que la animación sea fluida
            self.postMessage({
                type: 'SWAP',
                indices: [i, minIdx]
            } as VisualEvent);

            await new Promise(r => setTimeout(r, 50));
        }
    }
}

/**
 * Listener de mensajes del hilo principal
 */
self.onmessage = async (e: MessageEvent<{ type: 'START', data: number[] }>) => {
    if (e.data.type === 'START') {
        const data = e.data.data;
        const proxiedData = createDataProxy(data);

        console.log('🧠 Worker: Iniciando Selection Sort...');
        await selectionSort(proxiedData);
        console.log('🧠 Worker: Algoritmo finalizado.');
    }
};
