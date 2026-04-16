import { sleepCMP, sleepSWAP } from '../algorithm.worker';

/**
 * Selection Sort con delays para visualización.
 */
export async function selectionSort(array: number[]) {
    const n = array.length;

    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;

        for (let j = i + 1; j < n; j++) {
            if (array[j] < array[minIdx]) {
                minIdx = j;
            }

            await sleepCMP();
        }

        if (minIdx !== i) {
            [array[i], array[minIdx]] = [array[minIdx], array[i]];
            await sleepSWAP();
        }
    }
}
