import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const mergeSortAlgorithm: SortingAlgorithm = {
    name: 'Merge Sort',
    sort: (array, _swap, probe, compare) => mergeSort(array, probe, compare),
};

export async function mergeSort(
    array: number[],
    probe: (i: number) => number,
    compare: (i: number, j: number) => void,
    left = 0,
    right = array.length - 1,
) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    await mergeSort(array, probe, compare, left, mid);
    await mergeSort(array, probe, compare, mid + 1, right);
    await merge(array, probe, compare, left, mid, right);
}

async function merge(
    array: number[],
    probe: (i: number) => number,
    compare: (i: number, j: number) => void,
    left: number,
    mid: number,
    right: number,
) {
    const leftN = mid - left + 1;
    const rightN = right - mid;

    // copiamos a buffers temporales con `probe` (lee del array subyacente, emite PROBE).
    // Antes se usaba `array.slice(...)`, que iteraba a través del Proxy y disparaba COMPARE
    // espurios sin que el algoritmo lo pidiera; además las comparaciones reales caían sobre
    // arrays planos y no emitían ningún evento, dejando el merge visualmente mudo.
    const leftArr = new Array<number>(leftN);
    const rightArr = new Array<number>(rightN);
    // cada probe va precedido de `await sleepCMP()` para que el barrido de copia se vea
    // en el tiempo en lugar de emitir N eventos sincronos que iluminan medio array de golpe.
    // Hace visible el coste O(n) de memoria extra del merge sort (rasgo distintivo del algoritmo).
    for (let p = 0; p < leftN; p++) {
        await sleepCMP();
        leftArr[p] = probe(left + p);
    }
    for (let p = 0; p < rightN; p++) {
        await sleepCMP();
        rightArr[p] = probe(mid + 1 + p);
    }

    let i = 0, j = 0, k = left;

    while (i < leftN && j < rightN) {
        await sleepCMP();
        // Comparación real del merge: emitimos COMPARE explícito con los índices globales
        // de los dos elementos en juego para que el visualizador los resalte.
        compare(left + i, mid + 1 + j);
        if (leftArr[i] <= rightArr[j]) {
            array[k++] = leftArr[i++];
        } else {
            array[k++] = rightArr[j++];
        }
        await sleepWRITE();
    }

    while (i < leftN) {
        array[k++] = leftArr[i++];
        await sleepWRITE();
    }

    while (j < rightN) {
        array[k++] = rightArr[j++];
        await sleepWRITE();
    }
}
