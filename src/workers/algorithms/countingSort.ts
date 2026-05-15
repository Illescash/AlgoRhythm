import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const countingSortAlgorithm: SortingAlgorithm = {
    name: 'Counting Sort',
    sort: countingSort,
};

async function countingSort(
    array: number[],
    swap: (i: number, j: number) => void,
    probe: (i: number) => number,
    compare: (i: number, j: number) => void,
) {
    const n = array.length;

    // Fase 1: encontrar el máximo. Cada iteración inspecciona UNA posición -> usamos probe().
    let max = probe(0);
    for (let i = 1; i < n; i++) {
        await sleepCMP();
        const v = probe(i);
        if (v > max) max = v;
    }

    // Fase 2: construir el array de conteo. Lectura solitaria por iteración -> probe().
    const count = new Array(max + 1).fill(0);
    for (let i = 0; i < n; i++) {
        await sleepCMP();
        count[probe(i)]++;
    }

    // Fase 3: reconstruir. La búsqueda lineal interna también es lectura solitaria.
    let writeIdx = 0;
    for (let val = 0; val <= max; val++) {
        while (count[val] > 0) {
            let srcIdx = writeIdx;
            while (srcIdx < n) {
                await sleepCMP();
                if (probe(srcIdx) === val) break;
                srcIdx++;
            }
            if (srcIdx !== writeIdx && srcIdx < n) {
                // anunciar el swap. La PROBE mas reciente esta en srcIdx; writeIdx
                // nunca aparecio en un evento -> sin esto, su barra se redimensiona silenciosa.
                compare(writeIdx, srcIdx);
                swap(writeIdx, srcIdx);
                await sleepWRITE();
            }
            writeIdx++;
            count[val]--;
        }
    }
}
