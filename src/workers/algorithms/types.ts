export interface SortingAlgorithm {
    name: string;
    /**
 * Argumentos auxiliares pasados por el worker:
 * - `probe(i)`: emite PROBE (un índice) y devuelve `array[i]` leído del array subyacente,
 * sin pasar por el Proxy. Para lecturas solitarias (countingSort, mergeSort en la copia
 * a buffers temporales).
 * - `compare(i, j)`: emite COMPARE [i, j] de forma explícita, útil cuando la comparación
 * real del algoritmo ocurre sobre buffers locales (no sobre el proxy), p. ej. mergeSort.
 */
    sort(
        array: number[],
        swap: (i: number, j: number) => void,
        probe: (i: number) => number,
        compare: (i: number, j: number) => void,
    ): Promise<void>;
}

export interface SearchSignal {
    found(index: number): void;
    notFound(): void;
    setRange(low: number, high: number): void;
}

export interface SearchAlgorithm {
    name: string;
    search(array: number[], target: number, signal: SearchSignal): Promise<void>;
}
