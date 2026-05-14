import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const quickSortAlgorithm: SortingAlgorithm = {
    name: 'Quick Sort',
    sort: (array, swap) => quickSort(array, swap),
};

async function quickSort(array: number[], swap: (i: number, j: number) => void, low = 0, high = array.length - 1) {
    if (low < high) {
        const pivotIdx = await partition(array, swap, low, high);
        await quickSort(array, swap, low, pivotIdx - 1);
        await quickSort(array, swap, pivotIdx + 1, high);
    }
}

async function partition(array: number[], swap: (i: number, j: number) => void, low: number, high: number): Promise<number> {
    let i = low - 1;

    for (let j = low; j < high; j++) {
        await sleepCMP();
        // comparamos releyendo `array[high]` en cada iteración (en vez de capturar
        // el pivote en una constante). Así el DataProxy empareja correctamente j con high
        // y el visualizador muestra la barra actual junto al pivote, no a su predecesora.
        if (array[j] <= array[high]) {
            i++;
            if (i !== j) {
                swap(i, j);
                await sleepWRITE();
            }
        }
    }

    if (i + 1 !== high) {
        swap(i + 1, high);
        await sleepWRITE();
    }
    return i + 1;
}
