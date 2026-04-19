import { createDataProxy } from './dataProxy';
import { setTimings, setCancelled } from './sleep';
import type { SortingAlgorithm, SearchAlgorithm, SearchSignal } from './algorithms/types';
import type { VisualEvent } from '../core/eventBus';
import { selectionSortAlgorithm } from './algorithms/selectionSort';
import { quickSortAlgorithm } from './algorithms/quickSort';
import { mergeSortAlgorithm } from './algorithms/mergeSort';
import { mergeSortInPlaceAlgorithm } from './algorithms/mergeSortInPlace';
import { linearSearchAlgorithm } from './algorithms/linearSearch';
import { binarySearchAlgorithm } from './algorithms/binarySearch';

const SORT_ALGORITHMS: Record<string, SortingAlgorithm> = {
    selectionSort: selectionSortAlgorithm,
    quickSort: quickSortAlgorithm,
    mergeSort: mergeSortAlgorithm,
    mergeSortInPlace: mergeSortInPlaceAlgorithm,
};

const SEARCH_ALGORITHMS: Record<string, SearchAlgorithm> = {
    linear: linearSearchAlgorithm,
    binary: binarySearchAlgorithm,
};

const DEFAULT_SORT = 'quickSort';
const DEFAULT_SEARCH = 'linear';

type StartMessage =
    | { type: 'START'; mode: 'sort';   data: number[]; algorithm?: string; cmpMs: number }
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

    const proxiedData = createDataProxy(e.data.data);

    try {
        if (e.data.mode === 'search') {
            const algorithm = SEARCH_ALGORITHMS[e.data.algorithm ?? DEFAULT_SEARCH] ?? SEARCH_ALGORITHMS[DEFAULT_SEARCH];
            const signal: SearchSignal = {
                found:    (index) => self.postMessage({ type: 'FOUND', index } as VisualEvent),
                notFound: ()      => self.postMessage({ type: 'NOT_FOUND' } as VisualEvent),
                setRange: (low, high) => self.postMessage({ type: 'RANGE', low, high } as VisualEvent),
            };
            await algorithm.search(proxiedData, e.data.target, signal);
        } else {
            const algorithm = SORT_ALGORITHMS[e.data.algorithm ?? DEFAULT_SORT] ?? SORT_ALGORITHMS[DEFAULT_SORT];
            await algorithm.sort(proxiedData);
            self.postMessage({ type: 'DONE' } as VisualEvent);
        }
    } catch (err) {
        if (err instanceof Error && err.message === 'CANCELLED') {
            self.postMessage({ type: 'DONE' } as VisualEvent);
        }
    }
};
