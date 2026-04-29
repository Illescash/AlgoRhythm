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
    const pivot = array[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        await sleepCMP();
        if (array[j] <= pivot) {
            i++;
            if (i !== j) {
                swap(i, j);
                await sleepWRITE();
            }
        }
    }

    swap(i + 1, high);
    await sleepWRITE();
    return i + 1;
}
