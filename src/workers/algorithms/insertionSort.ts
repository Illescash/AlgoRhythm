import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const insertionSortAlgorithm: SortingAlgorithm = {
    name: 'Insertion Sort',
    sort: insertionSort,
};

async function insertionSort(array: number[], swap: (i: number, j: number) => void) {
    const n = array.length;

    for (let i = 1; i < n; i++) {
        let j = i;

        while (j > 0) {
            await sleepCMP();
            if (array[j - 1] > array[j]) {
                swap(j - 1, j);
                await sleepWRITE();
                j--;
            } else {
                break;
            }
        }
    }
}
