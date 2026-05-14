import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const countingSortAlgorithm: SortingAlgorithm = {
    name: 'Counting Sort',
    sort: countingSort,
};

async function countingSort(array: number[], swap: (i: number, j: number) => void) {
    const n = array.length;

    // Fase 1: encontrar el máximo
    let max = array[0];
    for (let i = 1; i < n; i++) {
        await sleepCMP();
        if (array[i] > max) max = array[i];
    }

    // Fase 2: construir el array de conteo (cada lectura dispara COMPARE via proxy)
    const count = new Array(max + 1).fill(0);
    for (let i = 0; i < n; i++) {
        await sleepCMP();
        count[array[i]]++;
    }

    // Fase 3: reconstruir usando swap para que el visualizador lo capture.
    // Por cada valor val, buscamos dónde está en el array y lo traemos a su posición final.
    let writeIdx = 0;
    for (let val = 0; val <= max; val++) {
        while (count[val] > 0) {
            let srcIdx = writeIdx;
            while (srcIdx < n) {
                await sleepCMP();
                if (array[srcIdx] === val) break;
                srcIdx++;
            }
            if (srcIdx !== writeIdx && srcIdx < n) {
                swap(writeIdx, srcIdx);
                await sleepWRITE();
            }
            writeIdx++;
            count[val]--;
        }
    }
}
