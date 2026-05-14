import type { SearchAlgorithm, SearchSignal } from './types';
import { sleepCMP } from '../sleep';

async function jumpSearch(array: number[], target: number, signal: SearchSignal): Promise<void> {
    const n = array.length;
    const step = Math.floor(Math.sqrt(n));

    let prev = 0;
    let curr = step;

    // Saltar de bloque en bloque hasta superar el target
    while (curr < n) {
        signal.setRange(prev, Math.min(curr, n - 1));
        await sleepCMP();

        if (array[Math.min(curr, n - 1)] < target) {
            prev = curr;
            curr += step;
        } else {
            break;
        }
    }

    // Búsqueda lineal dentro del bloque
    const blockEnd = Math.min(curr, n - 1);
    signal.setRange(prev, blockEnd);

    for (let i = prev; i <= blockEnd; i++) {
        await sleepCMP();
        if (array[i] === target) {
            signal.found(i);
            return;
        }
    }

    signal.notFound();
}

export const jumpSearchAlgorithm: SearchAlgorithm = {
    name: 'Jump Search',
    search: jumpSearch,
};
