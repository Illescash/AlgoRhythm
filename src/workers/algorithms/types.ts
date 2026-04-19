export interface SortingAlgorithm {
    name: string;
    sort(array: number[]): Promise<void>;
}
