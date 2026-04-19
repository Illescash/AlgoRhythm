import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const mergeSortInPlaceAlgorithm: SortingAlgorithm = {
    name: 'Merge Sort (In-Place)',
    sort: (array) => mergeSortInPlace(array),
};

export async function mergeSortInPlace(array: number[], left = 0, right = array.length - 1) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    await mergeSortInPlace(array, left, mid);
    await mergeSortInPlace(array, mid + 1, right);
    await mergeInPlace(array, left, mid, right);
}

async function mergeInPlace(array: number[], left: number, mid: number, right: number) {
    let i = left;
    let j = mid + 1;

    while (i <= mid && j <= right) {
        await sleepCMP();
        if (array[i] <= array[j]) {
            i++;
        } else {
            // Insertar array[j] en la posición i desplazando el rango [i..j-1] una posición a la derecha
            const value = array[j];
            let k = j;
            while (k > i) {
                array[k] = array[k - 1];
                k--;
                await sleepWRITE();
            }
            array[i] = value;
            await sleepWRITE();
            i++;
            mid++;
            j++;
        }
    }
}
