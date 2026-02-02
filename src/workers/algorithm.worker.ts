import { createDataProxy } from './dataProxy';

/**
 * Web Worker para ejecutar algoritmos de ordenación.
 * 
 * Usa un Proxy (dataProxy.ts) para interceptar accesos al array y emitir
 * eventos COMPARE/SWAP sin modificar la lógica de los algoritmos.
 */

/**
 * Selection Sort con delays para visualización.
 */
async function selectionSort(array: number[]) {
    const n = array.length;

    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;

        for (let j = i + 1; j < n; j++) {
            if (array[j] < array[minIdx]) {
                minIdx = j;
            }

            await new Promise(r => setTimeout(r, .1));
        }

        if (minIdx !== i) {
            [array[i], array[minIdx]] = [array[minIdx], array[i]];
            await new Promise(r => setTimeout(r, .1));
        }
    }
}

/**
 * Punto de entrada del Worker.
 */
self.onmessage = async (e: MessageEvent<{ type: 'START', data: number[] }>) => {
    if (e.data.type === 'START') {
        const data = e.data.data;
        const proxiedData = createDataProxy(data);
        await selectionSort(proxiedData);
    }
};
