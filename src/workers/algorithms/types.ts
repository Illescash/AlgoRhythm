export interface SortingAlgorithm {
    name: string;
    sort(array: number[]): Promise<void>;
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
