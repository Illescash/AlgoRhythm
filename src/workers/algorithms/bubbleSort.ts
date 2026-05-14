import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const bubbleSortAlgorithm: SortingAlgorithm = {
    name: 'Bubble Sort',
    sort: bubbleSort,
};

async function bubbleSort(array: number[], swap: (i: number, j: number) => void) {
    const n = array.length;

    for (let i = 0; i < n - 1; i++) {
        let swapped = false;

        for (let j = 0; j < n - 1 - i; j++) {
            await sleepCMP();
            if (array[j] > array[j + 1]) {
                swap(j, j + 1);
                await sleepWRITE();
                swapped = true;
            }
        }

        if (!swapped) break;
    }
}
