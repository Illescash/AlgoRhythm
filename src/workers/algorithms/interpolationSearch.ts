import type { SearchAlgorithm, SearchSignal } from './types';
import { sleepCMP } from '../sleep';

async function interpolationSearch(array: number[], target: number, signal: SearchSignal): Promise<void> {
    let low = 0;
    let high = array.length - 1;

    while (low <= high) {
        signal.setRange(low, high);

        await sleepCMP();
        const lo = array[low];
        const hi = array[high];

        if (target < lo || target > hi) break;

        const range = hi - lo;
        // Evitar división por cero si todos los elementos son iguales
        const pos = range === 0
            ? low
            : low + Math.floor(((target - lo) / range) * (high - low));

        await sleepCMP();
        const value = array[pos];

        if (value === target) {
            signal.found(pos);
            return;
        }

        if (value < target) {
            low = pos + 1;
        } else {
            high = pos - 1;
        }
    }

    signal.notFound();
}

export const interpolationSearchAlgorithm: SearchAlgorithm = {
    name: 'Interpolation Search',
    search: interpolationSearch,
};
