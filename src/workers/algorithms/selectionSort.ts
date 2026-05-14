import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const selectionSortAlgorithm: SortingAlgorithm = {
    name: 'Selection Sort',
    sort: selectionSort,
};

async function selectionSort(array: number[], swap: (i: number, j: number) => void) {
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
            swap(i, minIdx);
            await sleepWRITE();
        }
    }
}
