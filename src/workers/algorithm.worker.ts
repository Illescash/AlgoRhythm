import { createDataProxy } from './dataProxy';
import type { SortingAlgorithm } from './algorithms/types';
import { selectionSortAlgorithm } from './algorithms/selectionSort';
import { quickSortAlgorithm } from './algorithms/quickSort';
import { mergeSortAlgorithm } from './algorithms/mergeSort';
import { mergeSortInPlaceAlgorithm } from './algorithms/mergeSortInPlace';

const ALGORITHMS: Record<string, SortingAlgorithm> = {
    selectionSort: selectionSortAlgorithm,
    quickSort: quickSortAlgorithm,
    mergeSort: mergeSortAlgorithm,
    mergeSortInPlace: mergeSortInPlaceAlgorithm,
};

const DEFAULT_ALGORITHM = 'quickSort';

self.onmessage = async (e: MessageEvent<{ type: 'START'; data: number[]; algorithm?: string }>) => {
    if (e.data.type === 'START') {
        const algorithm = ALGORITHMS[e.data.algorithm ?? DEFAULT_ALGORITHM] ?? ALGORITHMS[DEFAULT_ALGORITHM];
        const proxiedData = createDataProxy(e.data.data);
        await algorithm.sort(proxiedData);
        self.postMessage({ type: 'DONE' });
    }
};
