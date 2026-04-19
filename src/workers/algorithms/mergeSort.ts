import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const mergeSortAlgorithm: SortingAlgorithm = {
    name: 'Merge Sort',
    sort: (array) => mergeSort(array),
};

export async function mergeSort(array: number[], left = 0, right = array.length - 1) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    await mergeSort(array, left, mid);
    await mergeSort(array, mid + 1, right);
    await merge(array, left, mid, right);
}

async function merge(array: number[], left: number, mid: number, right: number) {
    const leftArr = array.slice(left, mid + 1);
    const rightArr = array.slice(mid + 1, right + 1);

    let i = 0, j = 0, k = left;

    while (i < leftArr.length && j < rightArr.length) {
        await sleepCMP();
        if (leftArr[i] <= rightArr[j]) {
            array[k++] = leftArr[i++];
        } else {
            array[k++] = rightArr[j++];
        }
        await sleepWRITE();
    }

    while (i < leftArr.length) {
        array[k++] = leftArr[i++];
        await sleepWRITE();
    }

    while (j < rightArr.length) {
        array[k++] = rightArr[j++];
        await sleepWRITE();
    }
}
