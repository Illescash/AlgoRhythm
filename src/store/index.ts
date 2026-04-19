import { create } from 'zustand';
import { CMP_MS } from '../lib/timing';
import type { AppMode, RunState, SortConfig, SearchConfig } from './types';

const DEFAULT_ARRAY_SIZE = 50;

const defaultSortConfig: SortConfig = {
    algorithm: 'quickSort',
    arraySize: DEFAULT_ARRAY_SIZE,
    cmpMs: CMP_MS,
    highlightFactor: 5,
    volume: 0.12,
    waveform: 'sine',
};

const defaultSearchConfig: SearchConfig = {
    algorithm: 'linear',
    arraySize: DEFAULT_ARRAY_SIZE,
    target: 42,
    cmpMs: CMP_MS,
    volume: 0.12,
    waveform: 'sine',
};

function generateArray(size: number): number[] {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
}

interface AppStore {
    mode: AppMode;
    runState: RunState;
    array: number[];
    searchResult: number | null;
    sortConfig: SortConfig;
    searchConfig: SearchConfig;

    setMode(mode: AppMode): void;
    updateSortConfig(patch: Partial<SortConfig>): void;
    updateSearchConfig(patch: Partial<SearchConfig>): void;
    setArray(array: number[]): void;
    shuffleArray(): void;
    reverseArray(): void;
    sortArrayAsc(): void;
    setRunState(state: RunState): void;
    setSearchResult(index: number | null): void;
}

export const useStore = create<AppStore>((set, get) => ({
    mode: 'sort',
    runState: 'idle',
    array: generateArray(DEFAULT_ARRAY_SIZE),
    searchResult: null,
    sortConfig: defaultSortConfig,
    searchConfig: defaultSearchConfig,

    setMode: (mode) => set({ mode, runState: 'idle', searchResult: null }),

    updateSortConfig: (patch) =>
        set(s => ({ sortConfig: { ...s.sortConfig, ...patch } })),

    updateSearchConfig: (patch) =>
        set(s => ({ searchConfig: { ...s.searchConfig, ...patch } })),

    setArray: (array) => set({ array }),

    shuffleArray: () => {
        const size = get().mode === 'sort'
            ? get().sortConfig.arraySize
            : get().searchConfig.arraySize;
        set({ array: generateArray(size) });
    },

    reverseArray: () =>
        set(s => ({ array: [...s.array].sort((a, b) => b - a) })),

    sortArrayAsc: () =>
        set(s => ({ array: [...s.array].sort((a, b) => a - b) })),

    setRunState: (runState) => set({ runState }),

    setSearchResult: (searchResult) => set({ searchResult }),
}));
