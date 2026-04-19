import type { SearchAlgorithm, SearchSignal } from './types';
import { sleepCMP } from '../sleep';

async function linearSearch(array: number[], target: number, signal: SearchSignal): Promise<void> {
    for (let i = 0; i < array.length; i++) {
        // El acceso a array[i] dispara el GET trap del DataProxy -> emite COMPARE automáticamente
        const value = array[i];
        await sleepCMP();

        if (value === target) {
            signal.found(i);
            return;
        }
    }
    signal.notFound();
}

export const linearSearchAlgorithm: SearchAlgorithm = {
    name: 'Linear Search',
    search: linearSearch,
};
