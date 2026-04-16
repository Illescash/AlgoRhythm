import { createDataProxy } from './dataProxy';

import { selectionSort } from './algorithms/selectionSort';

// Constantes de tiempo para las animaciones
const tiempoCMP: number = 10;
const tiempoSWAP: number = tiempoCMP * 5;

// Función genérica de sleep
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Funciones específicas para comparaciones y swaps
export const sleepCMP = () => sleep(tiempoCMP);
export const sleepSWAP = () => sleep(tiempoSWAP);

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
