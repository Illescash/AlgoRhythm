import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const selectionSortAlgorithm: SortingAlgorithm = {
    name: 'Selection Sort',
    sort: (array, swap, _probe, compare) => selectionSort(array, swap, compare),
};

async function selectionSort(
    array: number[],
    swap: (i: number, j: number) => void,
    compare: (i: number, j: number) => void,
) {
    const n = array.length;

    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;

        for (let j = i + 1; j < n; j++) {
            await sleepCMP();
            if (array[j] < array[minIdx]) {
                minIdx = j;
            }
        }

        if (minIdx !== i) {
            // anunciar el swap con un COMPARE explicito. Sin esto, la barra `i`
            // se redimensiona en silencio porque nunca participo en una COMPARE durante el pase.
            compare(i, minIdx);
            swap(i, minIdx);
            await sleepWRITE();
        }
    }
}
