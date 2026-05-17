import { create } from 'zustand';
import { CMP_MS } from '../lib/timing';
import type { AppMode, RunState, SortConfig, SearchConfig } from './types';

const DEFAULT_ARRAY_SIZE = 50;

export const DEFAULT_CUSTOM_SORT_CODE = `// API: array, swap(i, j), await sleepCMP(), await sleepWRITE()

for (let i = 0; i < array.length; i++) {
  for (let j = 0; j < array.length - i - 1; j++) {
    await sleepCMP();
    if (array[j] > array[j + 1]) {
      swap(j, j + 1);
      await sleepWRITE();
    }
  }
}
`;

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

// Simple seeded PRNG (mulberry32) - makes arrays reproducible when a seed is provided.
function mulberry32(seed: number) {
    return () => {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    };
}

function generateArray(size: number, seed?: number): number[] {
    const rand = seed !== undefined ? mulberry32(seed) : Math.random;
    return Array.from({ length: size }, () => Math.floor(rand() * 90) + 10);
}

interface AppStore {
    mode: AppMode;
    runState: RunState;
    // contador monotónico que identifica cada ejecución.
    // Se incrementa en startSort / startSearch. Los consumidores (StatStrip) lo usan
    // como dep para resetear métricas, evitando que un setRunState('running') -> 'running'
    // deduplicado por Zustand impida el reset entre ejecuciones consecutivas.
    runId: number;
    array: number[];
    searchResult: number | null;
    errorMessage: string | null;
    sortConfig: SortConfig;
    searchConfig: SearchConfig;
    customSortCode: string;

    setMode(mode: AppMode): void;
    updateSortConfig(patch: Partial<SortConfig>): void;
    updateSearchConfig(patch: Partial<SearchConfig>): void;
    setArray(array: number[]): void;
    shuffleArray(): void;
    reverseArray(): void;
    sortArrayAsc(): void;
    resizeArray(size: number): void;
    setRunState(state: RunState): void;
    setSearchResult(index: number | null): void;
    bumpRunId(): void;
    setCustomSortCode(code: string): void;
}

export const useStore = create<AppStore>((set, get) => ({
    mode: 'sort',
    runState: 'idle',
    runId: 0,
    array: generateArray(DEFAULT_ARRAY_SIZE),
    searchResult: null,
    errorMessage: null,
    sortConfig: defaultSortConfig,
    searchConfig: defaultSearchConfig,
    customSortCode: DEFAULT_CUSTOM_SORT_CODE,

    setMode: (mode) => set({ mode, runState: 'idle', searchResult: null, errorMessage: null }),

    updateSortConfig: (patch) =>
        set(s => ({ sortConfig: { ...s.sortConfig, ...patch } })),

    updateSearchConfig: (patch) =>
        set(s => ({ searchConfig: { ...s.searchConfig, ...patch } })),

    setArray: (array) => set({ array }),

    shuffleArray: () => {
        // Conserva el tamaño actual del array - evita sorpresas al cambiar de modo.
        const size = get().array.length || DEFAULT_ARRAY_SIZE;
        set({ array: generateArray(size), runState: 'idle', searchResult: null });
    },

    reverseArray: () =>
        set(s => ({
            array: [...s.array].sort((a, b) => b - a),
            runState: 'idle',
            searchResult: null,
        })),

    sortArrayAsc: () =>
        set(s => ({
            array: [...s.array].sort((a, b) => a - b),
            runState: 'idle',
            searchResult: null,
        })),

    resizeArray: (size) =>
        set(s => ({
            array: generateArray(size),
            sortConfig: { ...s.sortConfig, arraySize: size },
            searchConfig: { ...s.searchConfig, arraySize: size },
            runState: 'idle',
            searchResult: null,
        })),

    setRunState: (runState) => set({ runState }),

    setSearchResult: (searchResult) => set({ searchResult }),

    bumpRunId: () => set(s => ({ runId: s.runId + 1 })),

    setCustomSortCode: (customSortCode) => set({ customSortCode }),
}));
