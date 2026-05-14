import { createDataProxy } from './dataProxy';
import { setTimings, setCancelled } from './sleep';
import type { SortingAlgorithm, SearchAlgorithm, SearchSignal } from './algorithms/types';
import type { VisualEvent } from '../core/eventBus';
import { selectionSortAlgorithm } from './algorithms/selectionSort';
import { quickSortAlgorithm } from './algorithms/quickSort';
import { mergeSortAlgorithm } from './algorithms/mergeSort';
import { mergeSortInPlaceAlgorithm } from './algorithms/mergeSortInPlace';
import { bubbleSortAlgorithm } from './algorithms/bubbleSort';
import { insertionSortAlgorithm } from './algorithms/insertionSort';
import { heapSortAlgorithm } from './algorithms/heapSort';
import { shellSortAlgorithm } from './algorithms/shellSort';
import { countingSortAlgorithm } from './algorithms/countingSort';
import { linearSearchAlgorithm } from './algorithms/linearSearch';
import { binarySearchAlgorithm } from './algorithms/binarySearch';
import { jumpSearchAlgorithm } from './algorithms/jumpSearch';
import { interpolationSearchAlgorithm } from './algorithms/interpolationSearch';

const SORT_ALGORITHMS: Record<string, SortingAlgorithm> = {
    selectionSort: selectionSortAlgorithm,
    quickSort: quickSortAlgorithm,
    mergeSort: mergeSortAlgorithm,
    mergeSortInPlace: mergeSortInPlaceAlgorithm,
    bubbleSort: bubbleSortAlgorithm,
    insertionSort: insertionSortAlgorithm,
    heapSort: heapSortAlgorithm,
    shellSort: shellSortAlgorithm,
    countingSort: countingSortAlgorithm,
};

const SEARCH_ALGORITHMS: Record<string, SearchAlgorithm> = {
    linear: linearSearchAlgorithm,
    binary: binarySearchAlgorithm,
    jump: jumpSearchAlgorithm,
    interpolation: interpolationSearchAlgorithm,
};

const DEFAULT_SORT = 'quickSort';
const DEFAULT_SEARCH = 'linear';

type StartMessage =
    | { type: 'START'; mode: 'sort'; data: number[]; algorithm?: string; cmpMs: number }
    | { type: 'START'; mode: 'search'; data: number[]; algorithm?: string; target: number; cmpMs: number };

type WorkerMessage = StartMessage | { type: 'CANCEL' };

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    if (e.data.type === 'CANCEL') {
        setCancelled(true);
        return;
    }

    if (e.data.type !== 'START') return;

    setCancelled(false);
    setTimings(e.data.cmpMs);

    const { proxy, swap } = createDataProxy(e.data.data);

    try {
        if (e.data.mode === 'search') {
            const searchKey = e.data.algorithm ?? DEFAULT_SEARCH;
            if (!SEARCH_ALGORITHMS[searchKey]) console.warn(`Unknown search algorithm "${searchKey}", falling back to "${DEFAULT_SEARCH}"`);
            const algorithm = SEARCH_ALGORITHMS[searchKey] ?? SEARCH_ALGORITHMS[DEFAULT_SEARCH];
            const signal: SearchSignal = {
                found: (index) => self.postMessage({ type: 'FOUND', index } as VisualEvent),
                notFound: () => self.postMessage({ type: 'NOT_FOUND' } as VisualEvent),
                setRange: (low, high) => self.postMessage({ type: 'RANGE', low, high } as VisualEvent),
            };
            await algorithm.search(proxy, e.data.target, signal);
        } else {
            const sortKey = e.data.algorithm ?? DEFAULT_SORT;
            if (!SORT_ALGORITHMS[sortKey]) console.warn(`Unknown sort algorithm "${sortKey}", falling back to "${DEFAULT_SORT}"`);
            const algorithm = SORT_ALGORITHMS[sortKey] ?? SORT_ALGORITHMS[DEFAULT_SORT];
            await algorithm.sort(proxy, swap);
            self.postMessage({ type: 'DONE' } as VisualEvent);
        }
    } catch (err) {
        if (err instanceof Error && err.message === 'CANCELLED') {
            self.postMessage({ type: 'CANCELLED' } as VisualEvent);
            return;
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error('[algorithm.worker] Error durante la ejecución:', err);
        self.postMessage({ type: 'ERROR', message } as VisualEvent);
    }
};
