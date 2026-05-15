import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const heapSortAlgorithm: SortingAlgorithm = {
    name: 'Heap Sort',
    sort: (array, swap, _probe, compare) => heapSort(array, swap, compare),
};

async function heapSort(
    array: number[],
    swap: (i: number, j: number) => void,
    compare: (i: number, j: number) => void,
) {
    const n = array.length;

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await heapify(array, swap, compare, n, i);
    }

    for (let i = n - 1; i > 0; i--) {
        // anunciar la extraccion max-to-end con un COMPARE explicito. Sin esto, los
        // bares 0 e i se redimensionan en silencio porque ninguno estuvo en una COMPARE reciente.
        compare(0, i);
        swap(0, i);
        await sleepWRITE();
        await heapify(array, swap, compare, i, 0);
    }
}

async function heapify(
    array: number[],
    swap: (i: number, j: number) => void,
    compare: (i: number, j: number) => void,
    n: number,
    root: number,
) {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    if (left < n) {
        await sleepCMP();
        if (array[left] > array[largest]) largest = left;
    }

    if (right < n) {
        await sleepCMP();
        if (array[right] > array[largest]) largest = right;
    }

    if (largest !== root) {
        // anunciar el swap padre<->hijo. La barra `root` no estuvo necesariamente en la
        // ultima COMPARE (el GET trap del proxy empareja left/largest o right/largest, no root).
        compare(root, largest);
        swap(root, largest);
        await sleepWRITE();
        await heapify(array, swap, compare, n, largest);
    }
}
