import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const shellSortAlgorithm: SortingAlgorithm = {
    name: 'Shell Sort',
    sort: shellSort,
};

async function shellSort(array: number[], swap: (i: number, j: number) => void) {
    const n = array.length;

    // Secuencia de Knuth: 1, 4, 13, 40, 121...
    let gap = 1;
    while (gap < Math.floor(n / 3)) gap = gap * 3 + 1;

    while (gap >= 1) {
        for (let i = gap; i < n; i++) {
            let j = i;

            while (j >= gap) {
                await sleepCMP();
                if (array[j - gap] > array[j]) {
                    swap(j - gap, j);
                    await sleepWRITE();
                    j -= gap;
                } else {
                    break;
                }
            }
        }

        gap = Math.floor(gap / 3);
    }
}
