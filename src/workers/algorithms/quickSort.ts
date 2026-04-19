import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const quickSortAlgorithm: SortingAlgorithm = {
    name: 'Quick Sort',
    sort: (array) => quickSort(array),
};

export async function quickSort(array: number[], low = 0, high = array.length - 1) {
    if (low < high) {
        const pivotIdx = await partition(array, low, high);
        await quickSort(array, low, pivotIdx - 1);
        await quickSort(array, pivotIdx + 1, high);
    }
}

async function partition(array: number[], low: number, high: number): Promise<number> {
    const pivot = array[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        await sleepCMP();
        if (array[j] <= pivot) {
            i++;
            if (i !== j) {
                [array[i], array[j]] = [array[j], array[i]];
                await sleepWRITE();
            }
        }
    }

    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    await sleepWRITE();
    return i + 1;
}
