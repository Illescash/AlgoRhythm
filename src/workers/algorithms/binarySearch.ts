import type { SearchAlgorithm, SearchSignal } from './types';
import { sleepCMP } from '../sleep';

async function binarySearch(array: number[], target: number, signal: SearchSignal): Promise<void> {
    let low = 0;
    let high = array.length - 1;

    while (low <= high) {
        signal.setRange(low, high);

        const mid = Math.floor((low + high) / 2);
        // El acceso a array[mid] dispara el GET trap -> emite COMPARE automáticamente
        const value = array[mid];
        await sleepCMP();

        if (value === target) {
            signal.found(mid);
            return;
        }

        if (value < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    signal.notFound();
}

export const binarySearchAlgorithm: SearchAlgorithm = {
    name: 'Binary Search',
    search: binarySearch,
};
