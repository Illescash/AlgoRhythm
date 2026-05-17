export type AppMode = 'sort' | 'search';

export type SortAlgorithmKey = 'quickSort' | 'selectionSort' | 'mergeSort' | 'mergeSortInPlace' | 'bubbleSort' | 'insertionSort' | 'heapSort' | 'shellSort' | 'countingSort' | 'custom';
export type SearchAlgorithmKey = 'linear' | 'binary' | 'jump' | 'interpolation';

export type RunState = 'idle' | 'running' | 'done' | 'found' | 'notFound' | 'cancelled' | 'error';

export interface SortConfig {
    algorithm: SortAlgorithmKey;
    arraySize: number;
    cmpMs: number;
    highlightFactor: number;
    volume: number;
    waveform: OscillatorType;
}

export interface SearchConfig {
    algorithm: SearchAlgorithmKey;
    arraySize: number;
    target: number;
    cmpMs: number;
    volume: number;
    waveform: OscillatorType;
}
